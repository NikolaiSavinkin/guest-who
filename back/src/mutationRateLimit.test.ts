import express from "express";
import request from "supertest";
import { error_schema } from "../../shared/src/schema";
import { describe, expect, it } from "vitest";
import { createMutationRateLimiter } from "./mutationRateLimit";

describe("createMutationRateLimiter", () => {
    it("returns 429 with SharedError shape when limit exceeded", async () => {
        const app = express();
        const limiter = createMutationRateLimiter({
            windowMs: 60_000,
            max: 2,
        });
        app.post("/responses", limiter, (_req, res) => res.status(201).send("ok"));

        await request(app).post("/responses").expect(201);
        await request(app).post("/responses").expect(201);
        const res = await request(app).post("/responses");

        expect(res.status).toBe(429);
        expect(error_schema.safeParse(res.body).success).toBe(true);
        expect(res.body).toEqual({
            code: "rate_limited",
            message:
                "Too many mutation requests from this address. Please try again later.",
        });
    });

    it("does not apply to routes without the middleware", async () => {
        const app = express();
        const limiter = createMutationRateLimiter({
            windowMs: 60_000,
            max: 1,
        });
        app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
        app.post("/responses", limiter, (_req, res) => res.status(201).send("ok"));

        await request(app).post("/responses").expect(201);
        await request(app).post("/responses").expect(429);
        const health = await request(app).get("/health");
        expect(health.status).toBe(200);
        expect(health.body).toEqual({ status: "ok" });
    });

    it("reads RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX from env when overrides omitted", async () => {
        const app = express();
        const limiter = createMutationRateLimiter({
            env: {
                RATE_LIMIT_MAX: "1",
                RATE_LIMIT_WINDOW_MS: "60000",
            },
        });
        app.post("/responses", limiter, (_req, res) => res.status(201).send("ok"));

        await request(app).post("/responses").expect(201);
        const res = await request(app).post("/responses");
        expect(res.status).toBe(429);
        expect(res.body).toMatchObject({ code: "rate_limited" });
    });
});
