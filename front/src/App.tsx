import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Question} from './Question.tsx'

const QUESTIONS_ENDPOINT = "http://localhost:8000/questions"

type question = {
	id: number;
	question: string;
	answers: string[];
}

type response = {
	id: number;
	answer: string;
}

function App() {
	const [questionNum, setQuestionNum] = useState(0)
	const [questions, setQuestions] = useState([] as question[])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [responses, setResponses] = useState([])

	useEffect(() => {
		// Define the async function to fetch data
		const fetchData = async () => {
			setLoading(true); // Start loading
			setError(null); // Clear previous errors
			
			try {
				const response = await fetch(QUESTIONS_ENDPOINT);
			
				// Check if the response was successful (status code 200-299)
				if (!response.ok) {
				  throw new Error(`HTTP error! status: ${response.status}`);
				}
			
				// Parse the JSON response
				const jsonData = await response.json();
				setQuestions(jsonData);
			
			} catch (e) {
				setError(e.message);
				setQuestions([]); // Clear data on error
			
			} finally {
				setLoading(false); // Stop loading
			}
		};
		
		fetchData(); // Call the async function
	}, []);

	const handleNextQuestion = () => {
		if (questionNum === questions.length - 1) {
			// TODO: finish / submit stuff
			setQuestionNum(0)
		} else {
			setQuestionNum(questionNum + 1)
		}
	}

	const handleResponse = (id, answer) => {
		const response: response = {id, answer}
		setResponses([ ...responses, response])
	}

	const handleAnswer = (id, answer) => {
		handleNextQuestion()
		handleResponse(id, answer)
	}

	return loading ? (<p>Loading...</p>) : (<>
		<Question
			question={questions[questionNum]}
			handler={handleAnswer}
		/>
		<p>{responses.map(
			(response) => JSON.stringify(response)
		).toString()}</p>
	</>)
}

export default App
