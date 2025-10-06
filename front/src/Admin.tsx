import "./App.css";
import { useEffect, useState } from "react";
import { Ready } from "./Ready";

const RESPONSES_ENDPOINT = "http://localhost:8000/responses/names";

function Admin() {
    const [participants, setParticipants] = useState<string[]>([]);
    const [error, setError] = useState(null as Error | null);
    const [status, setStatus] = useState(
        "loading" as "loading" | "ready" | "playing" | "error"
    );

    useEffect(() => {
        const fetchData = async () => {
            setStatus("loading");
            setError(null);

            try {
                const res = await fetch(RESPONSES_ENDPOINT);

                if (!res.ok) {
                    const e = new Error(`HTTP error! status: ${res.status}`);
                    setError(e);
                    throw e;
                }

                const jsonData = await res.json();
                setParticipants(jsonData);
                setStatus("ready");
            } catch (e) {
                console.error(e);
                setParticipants([]); // Clear data on error
                setStatus("error");
            }
        };

        fetchData(); // Call the async function
    }, []);

    switch (status) {
        case "loading": {
            return <p>Loading...</p>;
        }

        case "ready": {
            return <Ready participants={participants} />;
        }

        case "playing": {
            return <p>Playing</p>;
        }

        case "error": {
            return (
                <p>
                    {error === null
                        ? "There was an unknown error"
                        : error.message}
                </p>
            );
        }
    }
}

export default Admin;
