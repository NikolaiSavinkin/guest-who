import { z } from "zod";
import { ObjectId } from "bson";

const _id_schema = z.string().refine((val) => ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectID",
});

export const question_schema = z.object({
    _id: _id_schema,
    question: z.string(),
    answers: z.array(z.string()),
});

export const question_response_schema = z.object({
    _id: _id_schema,
    question: z.string(),
    answer: z.string(),
});

export const question_response_submission_schema = z.object({
    questions: z.array(question_response_schema),
    name: z.string(),
});

export const game_schema = z.object({
    _id: _id_schema,
    it_id: _id_schema,
    it_name: z.string(),
    num_clues: z.number(),
    next_clue: z.number(),
    clues: z.array(question_response_schema),
});
