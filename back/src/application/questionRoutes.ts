import type { Application, Request, Response } from "express";
import { sharedError } from "../apiError";
import type { CreateAppDeps } from "./types";

export const registerQuestionRoutes = (
    app: Application,
    deps: CreateAppDeps
): void => {
    app.get("/questions", async (_req: Request, res: Response) => {
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
    });
};
