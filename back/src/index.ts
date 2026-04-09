// src/index.ts
import cors from "cors";
import express, {
    Express,
    Request as ExpressRequest,
    Response as ExpressResponse,
    Application,
} from "express";
import dotenv from "dotenv";
import {
    MongoClient,
    ServerApiVersion,
    Collection,
    ObjectId,
    InsertOneResult,
} from "mongodb";
import { question_response_submission_schema } from "@shared/schema";
import { Question, QuestionResponseSubmission, Game, SharedError } from "@shared/types";

const sharedError = (code: string, message: string): SharedError => ({
    code,
    message,
});

/** Stored `responses` document (API shape plus MongoDB fields). */
type ResponseDoc = QuestionResponseSubmission & {
    _id: ObjectId;
    createdAt?: Date;
};

dotenv.config();

const gameResourceLocation = (req: ExpressRequest, gameId: ObjectId): string => {
    const host = req.get("host");
    const path = `/games/${gameId.toHexString()}`;
    if (!host) {
        return path;
    }
    return `${req.protocol}://${host}${path}`;
};

const app: Application = express();
const port = process.env.PORT || 8000;

if (!process.env.CORS_ORIGIN) {
    throw new Error("CORS must be enabled. Define CORS_ORIGIN in .env file.");
}

const dbUri = process.env.DB_URI?.trim();
if (!dbUri) {
    throw new Error(
        "DB_URI must be set in the environment (e.g. in back/.env). Provide your MongoDB connection string; there is no default."
    );
}

const certPath = process.env.CERT?.trim();
if (!certPath) {
    throw new Error(
        "CERT must be set in the environment (e.g. in back/.env). Provide the filesystem path to your X.509 client certificate/key file used for MongoDB authentication."
    );
}

var corsOptions = {
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

console.log(
    `CORS Origin: ${corsOptions.origin} (${typeof corsOptions.origin})`
);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

const client = new MongoClient(dbUri, {
    tlsCertificateKeyFile: certPath,
    authMechanism: "MONGODB-X509",
    authSource: "$external",
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let questionsCollection: Collection | null = null;
let responsesCollection: Collection | null = null;
let gamesCollection: Collection | null = null;

async function connectDatabase(): Promise<void> {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        const db = client.db("guest_who");
        questionsCollection = db.collection("questions");
        responsesCollection = db.collection("responses");
        gamesCollection = db.collection("games");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error to be caught later
    }
}

app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
    res.send("Welcome to Express & TypeScript Server");
});

app.post("/games/new", async (req: ExpressRequest, res: ExpressResponse) => {
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
        const players = await responsesCollection.find<ResponseDoc>({}).toArray();

        if (players.length < 2) {
            return res.status(400).json(
                sharedError(
                    "not_ready",
                    "Not enough players to start the game"
                )
            );
        }

        const it = players[Math.floor(Math.random() * players.length)];

        // const new_game: Omit<Game, "_id"> = {
        // use Pick instead of Omit because Omit sometimes excludes the _id from all the clues
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
});

app.get("/games/:gameId", async (req: ExpressRequest, res: ExpressResponse) => {
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
        const game_doc = await gamesCollection.findOne({ _id: game_id });

        if (game_doc === null) {
            return res
                .status(404)
                .json(sharedError("game_not_found", "Game not found"));
        }

        return res.status(200).json(game_doc);
    } catch (error) {
        console.error("Error fetching game from MongoDB:", error);
        return res.status(500).json(
            sharedError("internal_server_error", "Internal server error")
        );
    }
});

app.get("/questions", async (_req: ExpressRequest, res: ExpressResponse) => {
    if (!questionsCollection) {
        return res.status(500).json(
            sharedError(
                "database_unavailable",
                "Could not connect to the database or questions collection not initialized."
            )
        );
    }

    try {
        const questions = await questionsCollection
            .find<Question>({})
            .toArray();
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
});

app.get(
    "/responses/names",
    async (req: ExpressRequest, res: ExpressResponse) => {
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
            const names = responseNamesFromDb.map(
                (responseNamesFromDb) => responseNamesFromDb.name
            );
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

app.post("/responses", async (req: ExpressRequest, res: ExpressResponse) => {
    //TODO: make idempotent

    if (!responsesCollection) {
        return res.status(500).json(
            sharedError(
                "database_unavailable",
                "Could not connect to the database or responses collection not initialized."
            )
        );
    }

    const submission = question_response_submission_schema.safeParse(req.body);

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
        const result: InsertOneResult = await responsesCollection.insertOne(
            doc
        );
        return res.status(201).send("Response saved successfully");
    } catch (error) {
        console.error("Error inserting response:", error);
        return res.status(500).json(
            sharedError("insert_failed", "Failed to store response")
        );
    }
});

async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        app.listen(port, () => {
            console.log(`Server is Fire at http://localhost:${port}`);
        });
    } catch (error) {
        console.error(
            "Failed to start the server due to database connection error."
        );
        // Handle the error appropriately, maybe exit the process
        process.exit(1);
    }
}

startServer().catch(console.error);
