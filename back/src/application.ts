import compression from "compression";
import cors from "cors";
import express, {
    Application,
    Request as ExpressRequest,
    Response as ExpressResponse,
} from "express";
import type { RequestHandler } from "express";
import helmet from "helmet";
import { registerGameRoutes } from "./application/gameRoutes";
import { registerQuestionRoutes } from "./application/questionRoutes";
import { registerResponseRoutes } from "./application/responseRoutes";
import type { CreateAppDeps, CreateAppOptions } from "./application/types";
import { registerHealthRoutes } from "./healthRoutes";
import { createMutationRateLimiter } from "./mutationRateLimit";

export type {
    AppCollections,
    CreateAppDeps,
    CreateAppOptions,
    GamesWriteCollection,
    QuestionsReadCollection,
    ResponsesWriteCollection,
} from "./application/types";

export const createApp = (
    deps: CreateAppDeps,
    options: CreateAppOptions
): Application => {
    const app = express();

    const trustProxy = options.trustProxy;
    if (trustProxy !== undefined) {
        app.set("trust proxy", trustProxy);
    }

    app.use(helmet({ contentSecurityPolicy: false }) as RequestHandler);
    app.use(compression());

    const mutationLimiter =
        options.mutationLimiter ??
        createMutationRateLimiter(options.mutationRateLimit);

    const corsOptions = {
        origin: options.corsOrigin === "*" ? true : options.corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };

    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));

    app.use(express.json());

    registerHealthRoutes(app, {
        pingMongo: deps.pingMongo,
    });

    app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
        res.send("Welcome to Express & TypeScript Server");
    });

    registerGameRoutes(app, deps, mutationLimiter);
    registerQuestionRoutes(app, deps);
    registerResponseRoutes(app, deps, mutationLimiter);

    return app;
};
