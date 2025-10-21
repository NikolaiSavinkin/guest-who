// src/index.ts
import express, {
    Express,
    Request as ExpressRequest,
    Response as ExpressResponse,
    Application,
} from "express";
import dotenv from "dotenv";
import {
    MongoClient,
    ServerApiVersion,
    Collection,
    ObjectId,
    InsertOneResult,
} from "mongodb";
import { question_response_submission_schema } from "@shared/schema";
import { Question, QuestionResponseSubmission, Game } from "@shared/types";

dotenv.config();

const uri = process.env.DB_URI
    ? process.env.DB_URI
    : `mongodb+srv://cluster0.8dk5hhj.mongodb.net/Cluster0?authSource=%24external&authMechanism=MONGODB-X509`;

const client = new MongoClient(uri, {
    tlsCertificateKeyFile: process.env.CERT,
    authMechanism: "MONGODB-X509",
    authSource: "$external",
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let questionsCollection: Collection | null = null;
let responsesCollection: Collection | null = null;
let gamesCollection: Collection | null = null;

async function connectDatabase(): Promise<void> {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        const db = client.db("guest_who");
        questionsCollection = db.collection("questions");
        responsesCollection = db.collection("responses");
        gamesCollection = db.collection("games");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error to be caught later
    }
}

const app: Application = express();
app.use(express.json());
const port = process.env.PORT || 8000;

app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
    res.send("Welcome to Express & TypeScript Server");
});

app.post("/games/new", async (req: ExpressRequest, res: ExpressResponse) => {
    if (!responsesCollection) {
        return res
            .status(500)
            .send(
                "Error: Could not connect to the database or responses collection not initialized."
            );
    }
    if (!gamesCollection) {
        return res
            .status(500)
            .send(
                "Error: Could not connect to the database or games collection not initialized."
            );
    }

    try {
        const players = await responsesCollection
            .find<QuestionResponseSubmission>({})
            .toArray();

        if (players.length < 2) {
            res.status(202).send("Not enough players to start the game");
        }

        const it = players[Math.floor(Math.random() * players.length)];

        // const new_game: Omit<Game, "_id"> = {
        // use Pick instead of Omit because Omit sometimes excludes the _id from all the clues
        const new_game: Pick<
            Game,
            "it_id" | "it_name" | "num_clues" | "next_clue" | "clues"
        > = {
            it_id: it._id,
            it_name: it.name,
            num_clues: it.questions.length,
            next_clue: 0,
            clues: it.questions,
        };

        try {
            const result = await gamesCollection.insertOne(new_game);
            if (!result.acknowledged) {
                throw new Error("Insert not acknowledged.");
            }
            return res
                .status(201)
                .location(
                    `${req.protocol}:${req.hostname}/games/${result.insertedId}`
                )
                .json({
                    ...new_game,
                    _id: result.insertedId,
                });
        } catch (error) {
            console.error("Error inserting response:", error);
            return res.status(500).json({ error: "Failed to store response" });
        }
    } catch (error) {
        console.error("Error fetching questions from MongoDB:", error);
        return res
            .status(500)
            .send("Error fetching questions from the database");
    }
});

app.get("/questions", async (_req: ExpressRequest, res: ExpressResponse) => {
    if (!questionsCollection) {
        return res
            .status(500)
            .send(
                "Error: Could not connect to the database or questions collection not initialized."
            );
    }

    try {
        const questions = await questionsCollection
            .find<Question>({})
            .toArray();
        return res.json(questions);
    } catch (error) {
        console.error("Error fetching questions from MongoDB:", error);
        return res
            .status(500)
            .send("Error fetching questions from the database");
    }
});

app.get(
    "/responses/names",
    async (req: ExpressRequest, res: ExpressResponse) => {
        if (!responsesCollection) {
            return res
                .status(500)
                .send(
                    "Error: Could not connect to the database or responses collection not initialized."
                );
        }

        try {
            const responseNamesFromDb = await responsesCollection
                .find<QuestionResponseSubmission>(
                    {},
                    { projection: { name: 1, _id: 1 } }
                )
                .toArray();
            const names = responseNamesFromDb.map(
                (responseNamesFromDb) => responseNamesFromDb.name
            );
            return res.json(names);
        } catch (error) {
            console.error("Error fetching questions from MongoDB:", error);
            return res
                .status(500)
                .send("Error fetching questions from the database");
        }
    }
);

app.post("/responses", async (req: ExpressRequest, res: ExpressResponse) => {
    //TODO: make idempotent

    if (!responsesCollection) {
        return res
            .status(500)
            .send(
                "Error: Could not connect to the database or responses collection not initialized."
            );
    }

    const submission = question_response_submission_schema.safeParse(req.body);

    if (!submission.success) {
        console.log(req.body);
        console.error(submission.error);
        return res.status(400).send("Invalid format");
    }

    const doc: QuestionResponseSubmission = {
        ...submission.data,
        createdAt: new Date(),
        _id: new ObjectId(),
    };

    try {
        const result: InsertOneResult = await responsesCollection.insertOne(
            doc
        );
        return res.status(201).send("Response saved successfully");
    } catch (error) {
        console.error("Error inserting response:", error);
        return res.status(500).json({ error: "Failed to store response" });
    }
});

async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        app.listen(port, () => {
            console.log(`Server is Fire at http://localhost:${port}`);
        });
    } catch (error) {
        console.error(
            "Failed to start the server due to database connection error."
        );
        // Handle the error appropriately, maybe exit the process
        process.exit(1);
    }
}

startServer().catch(console.error);
