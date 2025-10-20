type AnswerProps = {
    qid: string;
    question: string;
    text: string;
    handler: (id: string, question: string, answer: string) => void;
};

export function Answer({ qid, question, text, handler }: AnswerProps) {
    return (
        <button onClick={() => handler(qid, question, text)}> {text} </button>
    );
}
