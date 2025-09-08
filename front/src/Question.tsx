import { Answer } from "./Answer.tsx";

type QuestionProps = {
    question: {
        id: number;
        question: string;
        answers: string[];
    };
    handler: (id: number, answer: string) => void;
};

export function Question({ question, handler }: QuestionProps) {
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
