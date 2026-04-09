"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error_schema = exports.game_schema = exports.question_response_submission_schema = exports.question_response_schema = exports.question_schema = void 0;
const zod_1 = require("zod");
const bson_1 = require("bson");
const _id_schema = zod_1.z.string().refine((val) => bson_1.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectID",
});
exports.question_schema = zod_1.z.object({
    _id: _id_schema,
    question: zod_1.z.string(),
    answers: zod_1.z.array(zod_1.z.string()),
});
exports.question_response_schema = zod_1.z.object({
    _id: _id_schema,
    question: zod_1.z.string(),
    answer: zod_1.z.string(),
});
exports.question_response_submission_schema = zod_1.z.object({
    questions: zod_1.z.array(exports.question_response_schema).min(1, {
        message: "At least one question response is required",
    }),
    name: zod_1.z.string(),
});
exports.game_schema = zod_1.z.object({
    _id: _id_schema,
    it_id: _id_schema,
    it_name: zod_1.z.string(),
    num_clues: zod_1.z.number(),
    next_clue: zod_1.z.number(),
    clues: zod_1.z.array(exports.question_response_schema),
});
exports.error_schema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
});
