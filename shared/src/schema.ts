import { z } from "zod";
import { ObjectId } from "bson";

const _id_schema = z.string().refine((val) => ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectID",
});

/** High-entropy invite codes: URL-safe charset, min length 16, trimmed. */
export const invite_code_schema = z.string().trim().pipe(
    z
        .string()
        .min(1, { message: "Invite code cannot be empty" })
        .regex(/^[A-Za-z0-9_-]+$/, {
            message: "Invite code must be URL-safe (letters, digits, hyphen, underscore)",
        })
        .min(16, { message: "Invite code is too short" }),
);

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
    questions: z.array(question_response_schema).min(1, {
        message: "At least one question response is required",
    }),
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

export const error_schema = z.object({
    code: z.string(),
    message: z.string(),
});
