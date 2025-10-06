type ReadyProps = {
    participants: string[];
};
export function Ready({ participants }: ReadyProps) {
    return (
        <ul>
            {participants.map((name) => {
                return <li>{name}</li>;
            })}
        </ul>
    );
}
