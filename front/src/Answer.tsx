export function Answer({qid, text, handler}) {
	return (<button onClick={() => handler(qid, text)}> {text} </button>)
}
