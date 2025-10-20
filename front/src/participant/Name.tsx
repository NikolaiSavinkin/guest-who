import type { QuestionResponse } from "@shared/types";

type NameProps = {
    name: string;
    setName: (value: React.SetStateAction<string>) => void;
    questionResponses: QuestionResponse[];
    submitResponses: (
        questions: QuestionResponse[],
        name: string
    ) => Promise<void>;
};

export function Name({
    name,
    setName,
    questionResponses,
    submitResponses,
}: NameProps) {
    return (
        <>
            <div>
                <h2>Thanks for answering!</h2>
                <label>
                    Your name:{" "}
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && name.trim()) {
                                e.preventDefault();
                                submitResponses(questionResponses, name);
                            }
                        }}
                        placeholder="Enter your name"
                        autoComplete="given-name"
                        autoFocus={true}
                    />
                </label>
                <button
                    onClick={() => submitResponses(questionResponses, name)}
                    disabled={!name.trim()}
                >
                    Submit all answers
                </button>
            </div>
        </>
    );
}
