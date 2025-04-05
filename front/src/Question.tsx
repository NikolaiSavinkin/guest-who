import {Answer} from './Answer.tsx'

export function Question({question, handler}) {
      return (<>
		<h1>{question.question}</h1>
		<ul>
			{question.answers.map(
				( answer ) => {
					return (<li> <Answer
						qid={question.id}
						text={answer}
						handler={handler}
					/> </li>)
				}
			)}
		</ul>
	</>)
}
