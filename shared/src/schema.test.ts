import { describe, expect, it } from "vitest";
import {
    error_schema,
    invite_code_schema,
    question_response_schema,
    question_response_submission_schema,
    question_schema,
} from "./schema";

const validObjectId = "507f1f77bcf86cd799439011";

describe("invite_code_schema", () => {
    const validInviteCode = "abcdefghijklmnop";

    it("rejects empty string", () => {
        expect(invite_code_schema.safeParse("").success).toBe(false);
    });

    it("rejects whitespace-only after trim", () => {
        expect(invite_code_schema.safeParse("   \t  ").success).toBe(false);
    });

    it("rejects too short codes with valid charset", () => {
        expect(invite_code_schema.safeParse("abcdefghijklmno").success).toBe(false);
    });

    it("rejects disallowed characters", () => {
        const invalid = [
            "abcdefghijklmnop!", // punctuation
            "abcdefghijklm opq", // interior space (not removed by trim)
            "abcdefghijklmnopé", // non-ascii
            "abcd\nefghijklmnop", // interior newline (trim does not remove it)
        ];
        for (const code of invalid) {
            expect(invite_code_schema.safeParse(code).success).toBe(false);
        }
    });

    it("accepts a representative URL-safe code at minimum length", () => {
        expect(invite_code_schema.safeParse(validInviteCode).success).toBe(true);
    });

    it("accepts hyphens and underscores in the code", () => {
        expect(invite_code_schema.safeParse("abcd-efgh_ijklmnop").success).toBe(true);
    });
});

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

describe("error_schema", () => {
    it("rejects non-objects and missing fields", () => {
        expect(error_schema.safeParse(null).success).toBe(false);
        expect(error_schema.safeParse({ code: "x" }).success).toBe(false);
        expect(error_schema.safeParse({ message: "m" }).success).toBe(false);
    });

    it("accepts minimal valid payload", () => {
        const result = error_schema.safeParse({
            code: "ERR",
            message: "Something went wrong",
        });
        expect(result.success).toBe(true);
    });
});
