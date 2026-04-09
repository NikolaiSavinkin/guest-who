import { describe, expect, it } from "vitest";
import {
    question_response_schema,
    question_response_submission_schema,
    question_schema,
} from "./schema";

const validObjectId = "507f1f77bcf86cd799439011";

describe("_id ObjectId refinement", () => {
    it("rejects invalid strings", () => {
        const invalidIds = ["", "not-valid", "123", "zzzzzzzzzzzzzzzzzzzzzzzz"];
        for (const _id of invalidIds) {
            const result = question_schema.safeParse({
                _id,
                question: "q",
                answers: ["a"],
            });
            expect(result.success).toBe(false);
        }
    });

    it("accepts valid 24-hex ObjectId strings", () => {
        const result = question_schema.safeParse({
            _id: validObjectId,
            question: "q",
            answers: ["a"],
        });
        expect(result.success).toBe(true);
    });
});

describe("question_response_submission_schema", () => {
    const minimalQuestion = {
        _id: validObjectId,
        question: "Favorite color?",
        answer: "Blue",
    };

    it("rejects empty questions array", () => {
        const result = question_response_submission_schema.safeParse({
            questions: [],
            name: "Pat",
        });
        expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
        const result = question_response_submission_schema.safeParse({
            questions: [minimalQuestion],
        });
        expect(result.success).toBe(false);
    });

    it("accepts minimal valid payload", () => {
        const result = question_response_submission_schema.safeParse({
            questions: [minimalQuestion],
            name: "Pat",
        });
        expect(result.success).toBe(true);
    });
});

describe("question_response_schema", () => {
    const base = {
        _id: validObjectId,
        question: "Q",
        answer: "A",
    };

    it("requires question", () => {
        const { question: _q, ...rest } = base;
        const result = question_response_schema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it("requires answer", () => {
        const { answer: _a, ...rest } = base;
        const result = question_response_schema.safeParse(rest);
        expect(result.success).toBe(false);
    });
});
