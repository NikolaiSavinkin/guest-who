// src/index.ts
import express, { Express, Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Collection} from 'mongodb';

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.8dk5hhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
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

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.get('/questions', async (_req: Request, res: Response) => {
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
