import zod from "zod";
import { ObjectId } from "mongodb";

export const question_schema = zod.object({
    id: zod
        .string()
        .refine((val) => ObjectId.isValid(val), {
            message: "Invalid MongoDB ObjectID",
        }),
    question: zod.string(),
    answers: zod.array(zod.string()),
});

export const question_response_schema = zod.object({
    id: zod
        .string()
        .refine((val) => ObjectId.isValid(val), {
            message: "Invalid MongoDB ObjectID",
        }),
    answer: zod.string(),
});

export const question_response_submission_schema = zod.object({
    questions: zod.array(question_response_schema),
    name: zod.string(),
});
