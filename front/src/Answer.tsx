type AnswerProps = {
    qid: number;
    text: string;
    handler: (id: number, answer: string) => void;
};

export function Answer({qid, text, handler}: AnswerProps) {
	return (<button onClick={() => handler(qid, text)}> {text} </button>)
}
