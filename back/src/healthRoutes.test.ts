import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { registerHealthRoutes } from "./healthRoutes";

describe("registerHealthRoutes", () => {
    it("GET /health returns 200 with status ok", async () => {
        const app = express();
        registerHealthRoutes(app, {
            pingMongo: async () => undefined,
        });
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("GET /ready returns 200 when ping succeeds", async () => {
        const app = express();
        registerHealthRoutes(app, {
            pingMongo: async () => undefined,
        });
        const res = await request(app).get("/ready");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ready" });
    });

    it("GET /ready returns 503 when ping fails", async () => {
        const app = express();
        registerHealthRoutes(app, {
            pingMongo: async () => {
                throw new Error("unreachable");
            },
        });
        const res = await request(app).get("/ready");
        expect(res.status).toBe(503);
        expect(res.body).toEqual({
            status: "not_ready",
            error: "database_unreachable",
        });
    });
});
