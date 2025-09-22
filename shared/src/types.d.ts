import {question_schema, question_response_schema} from "./schema.ts"
import zod from "zod"

export type Question = zod.infer<typeof question_schema>;

export type QuestionResponse = zod.infer<typeof question_response_schema>;