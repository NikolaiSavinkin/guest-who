type AnswerProps = {
    qid: string;
    text: string;
    handler: (id: string, answer: string) => void;
};

export function Answer({ qid, text, handler }: AnswerProps) {
    return <button onClick={() => handler(qid, text)}> {text} </button>;
}
