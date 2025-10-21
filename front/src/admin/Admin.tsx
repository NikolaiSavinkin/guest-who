import "./../App.css";
import { useEffect, useState } from "react";
import { Ready } from "../participant/Ready";
import type { Game } from "@shared/types";
import { game_schema } from "@shared/schema";
import { Gameplay } from "./Gameplay";

const RESPONSES_ENDPOINT = "http://localhost:8000/responses/names";
const START_GAME_ENDPOINT = "http://localhost:8000/games/new";

function Admin() {
    const [participants, setParticipants] = useState<string[]>([]);
    const [game, setGame] = useState(null as Game | null);
    const [showName, setShowName] = useState(false);
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

    const startGame = async () => {
        try {
            const res = await fetch(START_GAME_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const e = new Error(
                    `Submit failed: (${res.status}) ${await res.text()}`
                );
                setError(e);
                throw e;
            }

            const json = await res.json();

            const new_game = game_schema.safeParse(json);
            if (new_game.error) {
                const e = new Error(
                    `Failed to get new game. Message: ${new_game.error}`
                );
                setError(e);
                throw e;
            }

            setStatus("playing");
            setGame(new_game.data);
        } catch (e) {
            console.error(e);
            setStatus("error");
        }
    };

    const toggleShowName = () => {
        setShowName(!showName);
    };

    const nextClue = () => {
        setGame((prev: Game | null) => {
            if (prev === null) return prev;
            const next: Game = { ...prev };
            next.next_clue =
                next.next_clue + 1 === next.num_clues ? 0 : next.next_clue + 1;
            return next;
        });
    };

    switch (status) {
        case "loading": {
            return <p>Loading...</p>;
        }

        case "ready": {
            return <Ready participants={participants} handler={startGame} />;
        }

        case "playing": {
            if (game === null) return <p>Game started without a game object</p>;

            return (
                <Gameplay
                    game={game}
                    showName={showName}
                    toggleShowName={toggleShowName}
                    nextClue={nextClue}
                />
            );
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
