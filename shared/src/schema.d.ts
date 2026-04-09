import { z } from "zod";
export declare const question_schema: z.ZodObject<{
    _id: z.ZodString;
    question: z.ZodString;
    answers: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const question_response_schema: z.ZodObject<{
    _id: z.ZodString;
    question: z.ZodString;
    answer: z.ZodString;
}, z.core.$strip>;
export declare const question_response_submission_schema: z.ZodObject<{
    questions: z.ZodArray<z.ZodObject<{
        _id: z.ZodString;
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>;
    name: z.ZodString;
}, z.core.$strip>;
export declare const game_schema: z.ZodObject<{
    _id: z.ZodString;
    it_id: z.ZodString;
    it_name: z.ZodString;
    num_clues: z.ZodNumber;
    next_clue: z.ZodNumber;
    clues: z.ZodArray<z.ZodObject<{
        _id: z.ZodString;
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const error_schema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
