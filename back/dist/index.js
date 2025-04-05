"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.8dk5hhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
let questionsCollection = null;
function connectDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            yield client.db("admin").command({ ping: 1 });
            console.log("Successfully connected to MongoDB!");
            const db = client.db('guest_who');
            questionsCollection = db.collection('questions');
        }
        catch (error) {
            console.error("Error connecting to MongoDB:", error);
            throw error; // Re-throw the error to be caught later
        }
    });
}
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.get('/', (req, res) => {
    res.send('Welcome to Express & TypeScript Server');
});
app.get('/questions', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!questionsCollection) {
        return res.status(500).send('Error: Could not connect to the database or questions collection not initialized.');
    }
    try {
        const questionsFromDb = yield questionsCollection.find({}).toArray();
        const formattedQuestions = questionsFromDb.map(doc => ({
            id: doc._id.toString(),
            question: doc.question,
            answers: doc.answers,
        }));
        res.json(formattedQuestions);
    }
    catch (error) {
        console.error('Error fetching questions from MongoDB:', error);
        res.status(500).send('Error fetching questions from the database');
    }
}));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield connectDatabase();
            app.listen(port, () => {
                console.log(`Server is Fire at http://localhost:${port}`);
            });
        }
        catch (error) {
            console.error("Failed to start the server due to database connection error.");
            // Handle the error appropriately, maybe exit the process
            process.exit(1);
        }
    });
}
startServer().catch(console.error);
