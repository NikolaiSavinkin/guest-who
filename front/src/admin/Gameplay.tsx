import type { Game } from "@shared/types";

type GameplayProps = {
    game: Game;
    showName: boolean;
    toggleShowName: () => void;
    nextClue: () => void;
};

export function Gameplay({
    game,
    showName,
    toggleShowName,
    nextClue,
}: GameplayProps) {
    return (
        <>
            <button onClick={toggleShowName}>
                {showName ? game.it_name : "Show Name"}
            </button>
            <button onClick={nextClue}>Show Next Clue</button>
            <p>
                {game.next_clue + 1}/{game.num_clues}:{" "}
                {game.clues[game.next_clue].question}
            </p>
            <h1>{game.clues[game.next_clue].answer}</h1>
        </>
    );
}
