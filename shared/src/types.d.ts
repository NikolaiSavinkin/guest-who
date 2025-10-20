import {
    question_schema,
    question_response_schema,
    game_schema,
} from "./schema.js";
import zod from "zod";
import { ObjectId } from "bson";

export type ObjectId = ObjectId;

export type Question = zod.infer<typeof question_schema>;

export type QuestionResponse = zod.infer<typeof question_response_schema>;

export type QuestionResponseSubmission = zod.infer<
    typeof question_response_submission_schema
>;

export type Game = zod.infer<typeof game_schema>;
