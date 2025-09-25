import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import type { Question, QuestionResponse } from "@shared/types";
import { QuestionBlock } from "./Question.tsx";

// TODO: move to env
const QUESTIONS_ENDPOINT = "http://localhost:8000/questions";
const SUBMIT_ENDPOINT = "http://localhost:8000/responses";

function App() {
    const [questionNum, setQuestionNum] = useState(0);
    const [questions, setQuestions] = useState([] as Question[]);
    const [error, setError] = useState(null as Error | null);
    const [responses, setResponses] = useState([] as QuestionResponse[]);
    const [status, setStatus] = useState(
        "loading" as "loading" | "question" | "submitted" | "error"
    );

    useEffect(() => {
        // Define the async function to fetch data
        const fetchData = async () => {
            setStatus("loading"); // Start loading
            setError(null); // Clear previous errors

            try {
                const res = await fetch(QUESTIONS_ENDPOINT);

                // Check if the response was successful (status code 200-299)
                if (!res.ok) {
                    const e = new Error(`HTTP error! status: ${res.status}`);
                    setError(e);
                    throw e;
                }

                // Parse the JSON response
                const jsonData = await res.json();
                setQuestions(jsonData);
                setStatus("question"); // Stop loading
            } catch (e) {
                console.error(e);
                setQuestions([]); // Clear data on error
                setStatus("error");
            }
        };

        fetchData(); // Call the async function
    }, []);

    const submitResponses = async (payload: QuestionResponse[]) => {
        if (status === "submitted") return;
        setStatus("submitted");
        try {
            const res = await fetch(SUBMIT_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                // Throw error for now
                const e = new Error(
                    `Submit failed: (${res.status}) ${await res.text()}`
                );
                setError(e);
                throw e;
            }

            const data = await res.text();
            console.log("Server reply:", data);
        } catch (e) {
            // For now we just log; surface this later
            console.error(e);
            setStatus("error");
        }
    };

    const handleAnswer = (id: string, answer: string) => {
        const response: QuestionResponse = { id, answer };
        setResponses((prev) => {
            const updated = [...prev, response];

            if (updated.length === questions.length && status != "submitted") {
                submitResponses(updated);
            }
            return updated;
        });

        setQuestionNum((q) => Math.min(q + 1, questions.length - 1));
    };

    switch (status) {
        case "loading": {
            return <p>Loading...</p>;
        }
        case "question": {
            return (
                <>
                    <QuestionBlock
                        question={questions[questionNum]}
                        handler={handleAnswer}
                    />
                    <p>
                        {responses
                            .map((response) => JSON.stringify(response))
                            .toString()}
                    </p>
                </>
            );
        }
        case "submitted": {
            return <p>Submitted! Thanks for participating :)</p>;
        }
        case "error": {
            return (
                <p>
                    {error === null
                        ? "There was an unknown error"
                        : error.message}
                </p>
            );
        }
    }
}

export default App;
