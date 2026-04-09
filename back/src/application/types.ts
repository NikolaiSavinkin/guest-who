import type { RequestHandler } from "express";
import type { Document, InsertOneResult } from "mongodb";
import { ObjectId } from "mongodb";
import type { Question } from "../../../shared/src/types";
import type { CreateMutationRateLimiterOptions } from "../mutationRateLimit";

/** Minimal collection surface used by routes; real `Collection` and test fakes both satisfy this. */
export type QuestionsReadCollection = {
    find(filter?: Document): { toArray(): Promise<Question[]> };
};

export type ResponsesWriteCollection = {
    find<T>(
        filter?: Document,
        options?: { projection?: Document }
    ): { toArray(): Promise<T[]> };
    insertOne(doc: Document): Promise<InsertOneResult>;
};

export type GamesWriteCollection = {
    insertOne(doc: Document): Promise<InsertOneResult>;
    findOne(filter: { _id: ObjectId }): Promise<Document | null>;
};

export type AppCollections = {
    questions: QuestionsReadCollection | null;
    responses: ResponsesWriteCollection | null;
    games: GamesWriteCollection | null;
};

export type CreateAppDeps = {
    collections: AppCollections;
    pingMongo: () => Promise<void>;
};

export type CreateAppOptions = {
    corsOrigin: string;
    trustProxy?: boolean | number;
    mutationLimiter?: RequestHandler;
    mutationRateLimit?: CreateMutationRateLimiterOptions;
};
