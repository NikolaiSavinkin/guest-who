import { useState } from "react";

type GetGameProps = {
    getGame: (game_id: string) => void;
};

// TODO: handle 404
export function GetGame({ getGame }: GetGameProps) {
    const [gameId, setGameId] = useState("");
    return (
        <>
            <label>
                Continue game:{" "}
                <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && gameId.trim()) {
                            e.preventDefault();
                            getGame(gameId);
                        }
                    }}
                    placeholder="Enter your game ID"
                    autoFocus={true}
                />
            </label>
        </>
    );
}
