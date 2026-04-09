import { ObjectId, type InsertOneResult } from "mongodb";
import type { RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import { createApp } from "./application";
import type { Question, QuestionResponseSubmission } from "../../shared/src/types";

const passThroughMutationLimiter: RequestHandler = (_req, _res, next) =>
    next();

type ResponseDoc = QuestionResponseSubmission & {
    _id: ObjectId;
    createdAt?: Date;
};

const testCorsOrigin = "http://localhost";

const buildMemoryCollections = () => {
    let questions: Question[] = [];
    const responses: ResponseDoc[] = [];
    const games = new Map<string, Record<string, unknown>>();

    const questionsCollection = {
        find: () => ({
            toArray: async () => questions,
        }),
    };

    const responsesCollection = {
        find:
            <T,>(_filter?: object, _options?: { projection?: Record<string, 1> }) => ({
                toArray: async () => responses as unknown as T[],
            }),
        insertOne: async (doc: ResponseDoc): Promise<InsertOneResult> => {
            responses.push(doc);
            return { acknowledged: true, insertedId: doc._id };
        },
    };

    const gamesCollection = {
        insertOne: async (
            doc: Record<string, unknown>
        ): Promise<InsertOneResult> => {
            const id = new ObjectId();
            games.set(id.toHexString(), { ...doc, _id: id });
            return { acknowledged: true, insertedId: id };
        },
        findOne: async (filter: { _id: ObjectId }) => {
            return games.get(filter._id.toHexString()) ?? null;
        },
    };

    return {
        setQuestions: (q: Question[]) => {
            questions = q;
        },
        collections: {
            questions: questionsCollection,
            responses: responsesCollection,
            games: gamesCollection,
        },
    };
};

const integrationAppOptions = {
    corsOrigin: testCorsOrigin,
    mutationLimiter: passThroughMutationLimiter,
} as const;

describe("createApp integration", () => {
    let memory: ReturnType<typeof buildMemoryCollections>;

    beforeEach(() => {
        memory = buildMemoryCollections();
    });

    it("GET /questions returns questions from the collection", async () => {
        const q: Question = {
            _id: new ObjectId().toHexString(),
            question: "Q1",
            answers: ["a", "b"],
        };
        memory.setQuestions([q]);
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/questions");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([q]);
    });

    it("POST /responses rejects invalid body", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app)
            .post("/responses")
            .send({ name: "x", questions: [] });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("validation_error");
    });

    it("POST /responses accepts a minimal valid payload", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const oid = new ObjectId().toHexString();
        const body = {
            name: "Ada",
            questions: [{ _id: oid, question: "Q", answer: "A" }],
        };
        const res = await request(app).post("/responses").send(body);
        expect(res.status).toBe(201);
        expect(res.text).toBe("Response saved successfully");
        expect(memory.collections.responses).toBeDefined();
    });

    it("GET /games/:gameId returns 400 for invalid id", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/games/not-an-objectid");
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("invalid_game_id");
    });

    it("GET /games/:gameId returns 404 when missing", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const id = new ObjectId().toHexString();
        const res = await request(app).get(`/games/${id}`);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe("game_not_found");
    });

    it("POST /games/new returns 400 when fewer than two responses exist", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).post("/games/new").send({});
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("not_ready");
    });

    it("POST /games/new returns 400 when exactly one response exists", async () => {
        const oid = new ObjectId().toHexString();
        await memory.collections.responses.insertOne({
            _id: new ObjectId(),
            name: "solo",
            questions: [{ _id: oid, question: "Q", answer: "A" }],
            createdAt: new Date(),
        });
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).post("/games/new").send({});
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("not_ready");
    });

    it("POST /games/new creates a game when at least two responses exist", async () => {
        const oid = new ObjectId().toHexString();
        const makeResponse = (name: string): ResponseDoc => ({
            _id: new ObjectId(),
            name,
            questions: [{ _id: oid, question: "Q", answer: "A" }],
            createdAt: new Date(),
        });
        await memory.collections.responses.insertOne(makeResponse("p1"));
        await memory.collections.responses.insertOne(makeResponse("p2"));

        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );

        const res = await request(app).post("/games/new").send({});
        expect(res.status).toBe(201);
        expect(res.headers.location).toMatch(/\/games\/[a-f0-9]{24}$/);
        expect(res.body.it_name).toMatch(/p1|p2/);
        expect(res.body.num_clues).toBe(1);
    });

    it("GET /responses/names returns an empty list when there are no responses", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/responses/names");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("GET /responses/names returns names in insertion order", async () => {
        const oid = new ObjectId().toHexString();
        const row = (name: string): ResponseDoc => ({
            _id: new ObjectId(),
            name,
            questions: [{ _id: oid, question: "Q", answer: "A" }],
            createdAt: new Date(),
        });
        await memory.collections.responses.insertOne(row("Ann"));
        await memory.collections.responses.insertOne(row("Ben"));
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/responses/names");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(["Ann", "Ben"]);
    });

    it("GET /games/:gameId returns the game document when it exists", async () => {
        const oid = new ObjectId().toHexString();
        const clue = { _id: oid, question: "Q", answer: "A" };
        const { insertedId } = await memory.collections.games.insertOne({
            it_id: oid,
            it_name: "It",
            num_clues: 1,
            next_clue: 0,
            clues: [clue],
        });
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get(`/games/${insertedId.toHexString()}`);
        expect(res.status).toBe(200);
        expect(res.body.it_name).toBe("It");
        expect(res.body.num_clues).toBe(1);
        expect(res.body.clues).toEqual([clue]);
    });

    it("GET /health returns ok", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("GET /ready returns ready when the database ping succeeds", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => undefined,
            },
            integrationAppOptions
        );
        const res = await request(app).get("/ready");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ready" });
    });

    it("GET /ready returns 503 when the database ping fails", async () => {
        const app = createApp(
            {
                collections: memory.collections,
                pingMongo: async () => {
                    throw new Error("down");
                },
            },
            integrationAppOptions
        );
        const res = await request(app).get("/ready");
        expect(res.status).toBe(503);
        expect(res.body.code).toBe("database_unreachable");
    });
});
