import {
    question_schema,
    question_response_schema,
    question_response_submission_schema,
    game_schema,
    error_schema,
} from "./schema.js";
import { z } from "zod";

export type { ObjectId } from "bson";

export type Question = z.infer<typeof question_schema>;

export type QuestionResponse = z.infer<typeof question_response_schema>;

export type QuestionResponseSubmission = z.infer<
    typeof question_response_submission_schema
>;

export type Game = z.infer<typeof game_schema>;

export type SharedError = z.infer<typeof error_schema>;
