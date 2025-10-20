import type { Game } from "@shared/types";

type GameplayProps = {
    game: Game;
};
export function Gameplay({ game }: GameplayProps) {
    return <h1>{game.it_name}</h1>;
}
