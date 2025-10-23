import { Answer } from "./Answer.tsx";

type QuestionBlockProps = {
    question: {
        _id: string;
        question: string;
        answers: string[];
    };
    handleAnswer: (id: string, question: string, answer: string) => void;
    handleBack: () => void;
};

export function QuestionBlock({
    question,
    handleAnswer,
    handleBack,
}: QuestionBlockProps) {
    return (
        <>
            <h1>{question.question}</h1>
            <ul>
                {question.answers.map((answer) => {
                    return (
                        <li key={answer}>
                            {" "}
                            <Answer
                                qid={question._id}
                                question={question.question}
                                text={answer}
                                handler={handleAnswer}
                            />{" "}
                        </li>
                    );
                })}
            </ul>
            <button onClick={handleBack}>Back</button>
        </>
    );
}
