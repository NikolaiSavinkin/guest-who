import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./../App.css";
import type { Question, QuestionResponse } from "@shared/types";
import { QuestionBlock } from "./Question.tsx";
import { Name } from "./Name.tsx";

const HOST = import.meta.env.VITE_HOST
    ? import.meta.env.VITE_HOST
    : "http://localhost:8000";

function Participant() {
    const [questionNum, setQuestionNum] = useState(0);
    const [questions, setQuestions] = useState([] as Question[]);
    const [name, setName] = useState("");
    const [error, setError] = useState(null as Error | null);
    const [responses, setResponses] = useState([] as QuestionResponse[]);
    const [status, setStatus] = useState(
        "loading" as "loading" | "question" | "name" | "submitted" | "error"
    );

    useEffect(() => {
        const fetchData = async () => {
            setStatus("loading");
            setError(null);

            try {
                const res = await fetch(HOST + "/questions");

                if (!res.ok || res.status != 304) {
                    const e = new Error(`HTTP error! status: ${res.status}`);
                    setError(e);
                    throw e;
                }

                const jsonData = await res.json();
                setQuestions(jsonData);
                setStatus("question");
            } catch (e) {
                console.error(e);
                setQuestions([]); // Clear data on error
                setStatus("error");
            }
        };

        fetchData(); // Call the async function
    }, []);

    const submitResponses = async (
        questions: QuestionResponse[],
        name: string
    ) => {
        if (status === "submitted") return;
        setStatus("submitted");
        try {
            const res = await fetch(HOST + "/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ questions, name }),
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

    const handleAnswer = (_id: string, question: string, answer: string) => {
        const response: QuestionResponse = { _id, question, answer };
        setResponses((prev) => {
            const updated = [...prev, response];

            if (updated.length === questions.length && status != "submitted") {
                setStatus("name");
            }
            return updated;
        });

        setQuestionNum((q) => Math.min(q + 1, questions.length - 1));
    };

    const handleBack = () => {
        if (status === "name") {
            setStatus("question");
        } else {
            setQuestionNum((q) => Math.max(q - 1, 0));
        }

        setResponses((prev) => {
            return prev.slice(0, -1);
        });
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
                        handleAnswer={handleAnswer}
                        handleBack={handleBack}
                    />
                </>
            );
        }
        case "name": {
            return (
                <Name
                    name={name}
                    setName={setName}
                    questionResponses={responses}
                    submitResponses={submitResponses}
                    handleBack={handleBack}
                />
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

export default Participant;
