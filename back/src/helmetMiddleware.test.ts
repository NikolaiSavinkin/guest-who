import express, { type RequestHandler } from "express";
import helmet from "helmet";
import request from "supertest";
import { describe, expect, it } from "vitest";

describe("helmet (aligned with back/src/index.ts)", () => {
    it("sets expected security headers and omits CSP when disabled", async () => {
        const app = express();
        app.use(helmet({ contentSecurityPolicy: false }) as RequestHandler);
        app.get("/ping", (_req, res) => res.status(200).json({ ok: true }));

        const res = await request(app).get("/ping");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(res.headers["content-security-policy"]).toBeUndefined();
    });
});
