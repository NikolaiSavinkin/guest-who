import type { Application, Request, Response } from "express";
import type { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import type { Game } from "../../../shared/src/types";
import { sharedError } from "../apiError";
import type { ResponseDoc } from "./responseRoutes";
import type { CreateAppDeps } from "./types";

const gameResourceLocation = (req: Request, gameId: ObjectId): string => {
    const host = req.get("host");
    const path = `/games/${gameId.toHexString()}`;
    if (!host) {
        return path;
    }
    return `${req.protocol}://${host}${path}`;
};

export const registerGameRoutes = (
    app: Application,
    deps: CreateAppDeps,
    mutationLimiter: RequestHandler
): void => {
    app.post(
        "/games/new",
        mutationLimiter,
        async (req: Request, res: Response) => {
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

    app.get("/games/:gameId", async (req: Request, res: Response) => {
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
                sharedError("internal_server_error", "Internal server error")
            );
        }
    });
};
