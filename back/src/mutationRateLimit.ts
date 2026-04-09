import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { sharedError } from "./apiError";

const DEFAULT_WINDOW_MS = 900_000;
const DEFAULT_MAX = 100;

export type CreateMutationRateLimiterOptions = {
    /** When set, used instead of `RATE_LIMIT_WINDOW_MS` from `env`. */
    windowMs?: number;
    /** When set, used instead of `RATE_LIMIT_MAX` from `env`. */
    max?: number;
    /** Defaults to `process.env`; override in tests. */
    env?: NodeJS.ProcessEnv;
};

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
    if (raw === undefined || raw.trim() === "") {
        return fallback;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

const mutationRateLimitExceeded = (
    _req: Request,
    res: Response,
    _next: NextFunction,
    options: { statusCode: number }
): void => {
    res.status(options.statusCode).json(
        sharedError(
            "rate_limited",
            "Too many mutation requests from this address. Please try again later."
        )
    );
};

export const createMutationRateLimiter = (
    options?: CreateMutationRateLimiterOptions
): ReturnType<typeof rateLimit> => {
    const env = options?.env ?? process.env;
    const windowMs =
        options?.windowMs ??
        parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
    const max = options?.max ?? parsePositiveInt(env.RATE_LIMIT_MAX, DEFAULT_MAX);

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: mutationRateLimitExceeded,
    });
};
