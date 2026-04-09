import compression from "compression";
import cors from "cors";
import express, {
    Application,
    Request as ExpressRequest,
    Response as ExpressResponse,
} from "express";
import type { RequestHandler } from "express";
import helmet from "helmet";
import type { Document, InsertOneResult } from "mongodb";
import { ObjectId } from "mongodb";
import { question_response_submission_schema } from "../../shared/dist/schema";
import type {
    Game,
    Question,
    QuestionResponseSubmission,
} from "../../shared/src/types";
import { sharedError } from "./apiError";
import { registerHealthRoutes } from "./healthRoutes";
import {
    createMutationRateLimiter,
    type CreateMutationRateLimiterOptions,
} from "./mutationRateLimit";

/** Stored `responses` document (API shape plus MongoDB fields). */
type ResponseDoc = QuestionResponseSubmission & {
    _id: ObjectId;
    createdAt?: Date;
};

/** Minimal collection surface used by routes; real `Collection` and test fakes both satisfy this. */
export type QuestionsReadCollection = {
    find(filter?: Document): { toArray(): Promise<Question[]> };
};

export type ResponsesWriteCollection = {
    find<T>(
        filter?: Document,
        options?: { projection?: Document }
    ): { toArray(): Promise<T[]> };
    insertOne(doc: Document): Promise<InsertOneResult>;
};

export type GamesWriteCollection = {
    insertOne(doc: Document): Promise<InsertOneResult>;
    findOne(filter: { _id: ObjectId }): Promise<Document | null>;
};

export type AppCollections = {
    questions: QuestionsReadCollection | null;
    responses: ResponsesWriteCollection | null;
    games: GamesWriteCollection | null;
};

export type CreateAppDeps = {
    collections: AppCollections;
    pingMongo: () => Promise<void>;
};

export type CreateAppOptions = {
    corsOrigin: string;
    trustProxy?: boolean | number;
    mutationLimiter?: RequestHandler;
    mutationRateLimit?: CreateMutationRateLimiterOptions;
};

const gameResourceLocation = (
    req: ExpressRequest,
    gameId: ObjectId
): string => {
    const host = req.get("host");
    const path = `/games/${gameId.toHexString()}`;
    if (!host) {
        return path;
    }
    return `${req.protocol}://${host}${path}`;
};

export const createApp = (
    deps: CreateAppDeps,
    options: CreateAppOptions
): Application => {
    const app = express();

    const trustProxy = options.trustProxy;
    if (trustProxy !== undefined) {
        app.set("trust proxy", trustProxy);
    }

    app.use(helmet({ contentSecurityPolicy: false }) as RequestHandler);
    app.use(compression());

    const mutationLimiter =
        options.mutationLimiter ??
        createMutationRateLimiter(options.mutationRateLimit);

    const corsOptions = {
        origin: options.corsOrigin === "*" ? true : options.corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };

    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));

    app.use(express.json());

    registerHealthRoutes(app, {
        pingMongo: deps.pingMongo,
    });

    app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
        res.send("Welcome to Express & TypeScript Server");
    });

    app.post(
        "/games/new",
        mutationLimiter,
        async (req: ExpressRequest, res: ExpressResponse) => {
            const { responses: responsesCollection, games: gamesCollection } =
                deps.collections;

            if (!responsesCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or responses collection not initialized."
                    )
                );
            }
            if (!gamesCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or games collection not initialized."
                    )
                );
            }

            try {
                const players = await responsesCollection
                    .find<ResponseDoc>({})
                    .toArray();

                if (players.length < 2) {
                    return res.status(400).json(
                        sharedError(
                            "not_ready",
                            "Not enough players to start the game"
                        )
                    );
                }

                const it = players[Math.floor(Math.random() * players.length)];

                const new_game: Pick<
                    Game,
                    "it_id" | "it_name" | "num_clues" | "next_clue" | "clues"
                > = {
                    it_id: it._id.toHexString(),
                    it_name: it.name,
                    num_clues: it.questions.length,
                    next_clue: 0,
                    clues: it.questions,
                };

                try {
                    const result = await gamesCollection.insertOne(new_game);
                    if (!result.acknowledged) {
                        throw new Error("Insert not acknowledged.");
                    }
                    return res
                        .status(201)
                        .location(gameResourceLocation(req, result.insertedId))
                        .json({
                            ...new_game,
                            _id: result.insertedId,
                        });
                } catch (error) {
                    console.error("Failed to create game", error);
                    return res.status(500).json(
                        sharedError("insert_failed", "Failed to create game")
                    );
                }
            } catch (error) {
                console.error("Error fetching questions from MongoDB:", error);
                return res.status(500).json(
                    sharedError(
                        "fetch_failed",
                        "Error fetching responses from the database"
                    )
                );
            }
        }
    );

    app.get(
        "/games/:gameId",
        async (req: ExpressRequest, res: ExpressResponse) => {
            const { games: gamesCollection } = deps.collections;

            if (!gamesCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or games collection not initialized."
                    )
                );
            }
            let game_id: ObjectId;

            try {
                game_id = new ObjectId(req.params.gameId);
            } catch (error) {
                console.log(JSON.stringify(req.params));
                console.error(error);
                return res.status(400).json(
                    sharedError("invalid_game_id", "Invalid game ID")
                );
            }

            try {
                const game_doc = await gamesCollection.findOne({
                    _id: game_id,
                });

                if (game_doc === null) {
                    return res
                        .status(404)
                        .json(sharedError("game_not_found", "Game not found"));
                }

                return res.status(200).json(game_doc);
            } catch (error) {
                console.error("Error fetching game from MongoDB:", error);
                return res.status(500).json(
                    sharedError(
                        "internal_server_error",
                        "Internal server error"
                    )
                );
            }
        }
    );

    app.get(
        "/questions",
        async (_req: ExpressRequest, res: ExpressResponse) => {
            const { questions: questionsCollection } = deps.collections;

            if (!questionsCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or questions collection not initialized."
                    )
                );
            }

            try {
                const questions = await questionsCollection.find({}).toArray();
                return res.json(questions);
            } catch (error) {
                console.error("Error fetching questions from MongoDB:", error);
                return res.status(500).json(
                    sharedError(
                        "fetch_failed",
                        "Error fetching questions from the database"
                    )
                );
            }
        }
    );

    app.get(
        "/responses/names",
        async (_req: ExpressRequest, res: ExpressResponse) => {
            const { responses: responsesCollection } = deps.collections;

            if (!responsesCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or responses collection not initialized."
                    )
                );
            }

            try {
                const responseNamesFromDb = await responsesCollection
                    .find<QuestionResponseSubmission>(
                        {},
                        { projection: { name: 1, _id: 1 } }
                    )
                    .toArray();
                const names = responseNamesFromDb.map((row) => row.name);
                return res.json(names);
            } catch (error) {
                console.error("Error fetching questions from MongoDB:", error);
                return res.status(500).json(
                    sharedError(
                        "fetch_failed",
                        "Error fetching response names from the database"
                    )
                );
            }
        }
    );

    app.post(
        "/responses",
        mutationLimiter,
        async (req: ExpressRequest, res: ExpressResponse) => {
            const { responses: responsesCollection } = deps.collections;

            if (!responsesCollection) {
                return res.status(500).json(
                    sharedError(
                        "database_unavailable",
                        "Could not connect to the database or responses collection not initialized."
                    )
                );
            }

            const submission = question_response_submission_schema.safeParse(
                req.body
            );

            if (!submission.success) {
                console.log(JSON.stringify(req.body));
                console.error(submission.error);
                return res.status(400).json(
                    sharedError("validation_error", "Invalid request body")
                );
            }

            const doc: ResponseDoc = {
                ...submission.data,
                createdAt: new Date(),
                _id: new ObjectId(),
            };

            try {
                await responsesCollection.insertOne(doc);
                return res.status(201).send("Response saved successfully");
            } catch (error) {
                console.error("Error inserting response:", error);
                return res.status(500).json(
                    sharedError("insert_failed", "Failed to store response")
                );
            }
        }
    );

    return app;
};
