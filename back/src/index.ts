// src/index.ts
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, type Document } from "mongodb";
import { createApp, type AppCollections } from "./application";

dotenv.config();

const port = process.env.PORT || 8000;

if (!process.env.CORS_ORIGIN) {
    throw new Error("CORS must be enabled. Define CORS_ORIGIN in .env file.");
}

const dbUri = process.env.DB_URI?.trim();
if (!dbUri) {
    throw new Error(
        "DB_URI must be set in the environment (e.g. in back/.env). Provide your MongoDB connection string; there is no default."
    );
}

const certPath = process.env.CERT?.trim();
if (!certPath) {
    throw new Error(
        "CERT must be set in the environment (e.g. in back/.env). Provide the filesystem path to your X.509 client certificate/key file used for MongoDB authentication."
    );
}

const trustProxyEnv = process.env.TRUST_PROXY?.trim();
const trustProxy: boolean | number =
    trustProxyEnv === "0" || trustProxyEnv === "false"
        ? false
        : trustProxyEnv === undefined || trustProxyEnv === ""
          ? process.env.NODE_ENV === "production"
              ? 1
              : false
          : (() => {
                const hops = Number.parseInt(trustProxyEnv, 10);
                return Number.isFinite(hops) && hops >= 0 ? hops : 1;
            })();

const corsOrigin = process.env.CORS_ORIGIN;

console.log(
    `CORS Origin: ${corsOrigin} (${typeof (corsOrigin === "*" ? true : corsOrigin)})`
);

const client = new MongoClient(dbUri, {
    tlsCertificateKeyFile: certPath,
    authMechanism: "MONGODB-X509",
    authSource: "$external",
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const collections: AppCollections = {
    questions: null,
    responses: null,
    games: null,
};

async function connectDatabase(): Promise<void> {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        const db = client.db("guest_who");
        collections.questions = db.collection("questions");
        collections.responses = db.collection("responses");
        collections.games = db.collection("games");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        const app = createApp(
            {
                collections,
                pingMongo: () =>
                    client.db("admin").command({ ping: 1 }).then(() => undefined),
            },
            { corsOrigin, trustProxy }
        );
        app.listen(port, () => {
            console.log(`Server is Fire at http://localhost:${port}`);
        });
    } catch (error) {
        console.error(
            "Failed to start the server due to database connection error."
        );
        process.exit(1);
    }
}

startServer().catch(console.error);
