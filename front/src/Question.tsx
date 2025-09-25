import { Answer } from "./Answer.tsx";

type QuestionBlockProps = {
    question: {
        id: string;
        question: string;
        answers: string[];
    };
    handler: (id: string, answer: string) => void;
};

export function QuestionBlock({ question, handler }: QuestionBlockProps) {
    return (
        <>
            <h1>{question.question}</h1>
            <ul>
                {question.answers.map((answer) => {
                    return (
                        <li key={answer}>
                            {" "}
                            <Answer
                                qid={question.id}
                                text={answer}
                                handler={handler}
                            />{" "}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
