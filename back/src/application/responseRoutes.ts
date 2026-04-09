import type { Application, Request, Response } from "express";
import type { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { question_response_submission_schema } from "../../../shared/dist/schema";
import type { QuestionResponseSubmission } from "../../../shared/src/types";
import { sharedError } from "../apiError";
import type { CreateAppDeps } from "./types";

/** Stored `responses` document (API shape plus MongoDB fields). */
export type ResponseDoc = QuestionResponseSubmission & {
    _id: ObjectId;
    createdAt?: Date;
};

export const registerResponseRoutes = (
    app: Application,
    deps: CreateAppDeps,
    mutationLimiter: RequestHandler
): void => {
    app.get("/responses/names", async (_req: Request, res: Response) => {
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
    });

    app.post(
        "/responses",
        mutationLimiter,
        async (req: Request, res: Response) => {
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
};
