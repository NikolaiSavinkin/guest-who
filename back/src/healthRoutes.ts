import { Application, Request, Response } from "express";

export type HealthDeps = {
    pingMongo: () => Promise<void>;
};

export const registerHealthRoutes = (
    app: Application,
    deps: HealthDeps
): void => {
    app.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    });

    app.get("/ready", async (_req: Request, res: Response) => {
        try {
            await deps.pingMongo();
            res.status(200).json({ status: "ready" });
        } catch {
            res.status(503).json({
                status: "not_ready",
                error: "database_unreachable",
            });
        }
    });
};
