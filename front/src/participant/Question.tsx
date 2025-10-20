import { Answer } from "./Answer.tsx";

type QuestionBlockProps = {
    question: {
        _id: string;
        question: string;
        answers: string[];
    };
    handler: (id: string, question: string, answer: string) => void;
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
                                qid={question._id}
                                question={question.question}
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
