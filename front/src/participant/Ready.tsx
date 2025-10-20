type ReadyProps = {
    participants: string[];
    handler: () => void;
};
export function Ready({ participants, handler }: ReadyProps) {
    return (
        <>
            <button onClick={handler}>Start Game</button>
            <h1>Participants:</h1>
            <ul>
                {participants.map((name, index) => {
                    return <li key={index}> {name}</li>;
                })}
            </ul>
        </>
    );
}
