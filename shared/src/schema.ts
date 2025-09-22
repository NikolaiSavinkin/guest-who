import zod from "zod";

export const question_schema = zod.object({
    id: zod.number(),
    question: zod.string(),
    answers: zod.array(zod.string()),
});

export const question_response_schema = zod.object({
    id: zod.number(),
    answer: zod.string(),
})