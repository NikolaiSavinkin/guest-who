import { GetGame } from "./GetGame";

type ReadyProps = {
    participants: string[];
    startGame: () => void;
    getGame: (game_id: string) => void;
};

export function Ready({ participants, startGame, getGame }: ReadyProps) {
    return (
        <>
            <GetGame getGame={getGame} />
            <button onClick={startGame}>Start New Game</button>
            <h1>Participants:</h1>
            <ul>
                {participants.map((name, index) => {
                    return <li key={index}> {name}</li>;
                })}
            </ul>
        </>
    );
}
