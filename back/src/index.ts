// src/index.ts
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, Application } from 'express';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Collection} from 'mongodb';
import {question_response_schema} from "@shared/schema";

dotenv.config();

const uri = process.env.DB_URI ?
process.env.DB_URI :
`mongodb+srv://cluster0.8dk5hhj.mongodb.net/Cluster0?authSource=%24external&authMechanism=MONGODB-X509`

const client = new MongoClient(uri, {
    tlsCertificateKeyFile: process.env.CERT,
    authMechanism: 'MONGODB-X509',
    authSource: '$external',
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let questionsCollection: Collection | null = null;

async function connectDatabase(): Promise<void> {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        const db = client.db('guest_who');
        questionsCollection = db.collection('questions');
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error to be caught later
    }
}

type QuestionDocument = {
    _id: any; // MongoDB uses _id, can be ObjectId or string
    question: string;
    answers: string[];
};

const app: Application = express();
const port = process.env.PORT || 8000;

app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.get('/questions', async (_req: ExpressRequest, res: ExpressResponse) => {
    if (!questionsCollection) {
        return res.status(500).send('Error: Could not connect to the database or questions collection not initialized.');
    }

    try {
        const questionsFromDb = await questionsCollection.find<QuestionDocument>({}).toArray();
        const formattedQuestions = questionsFromDb.map(doc => ({
            id: doc._id.toString(),
            question: doc.question,
            answers: doc.answers,
        }));
        res.json(formattedQuestions)
    } catch (error) {
        console.error('Error fetching questions from MongoDB:', error);
        res.status(500).send('Error fetching questions from the database');
    }
});

app.post('/responses', async (req: ExpressRequest, res: ExpressResponse) => {
    console.log("\n\n\nhello\n\n\n");
    const submission = question_response_schema.safeParse(req.body);
    if (!submission.success) {
        console.error(submission.error);
    } else {
        console.log(submission.data);
    }
    res.status(501).send('Work in progress EEEEXTRA')
})

async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        app.listen(port, () => {
            console.log(`Server is Fire at http://localhost:${port}`);
        })
    } catch (error) {
        console.error("Failed to start the server due to database connection error.");
        // Handle the error appropriately, maybe exit the process
        process.exit(1);
    }
}

startServer().catch(console.error);
