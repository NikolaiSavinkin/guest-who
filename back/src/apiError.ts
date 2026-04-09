import type { SharedError } from "../../shared/src/types";

export const sharedError = (code: string, message: string): SharedError => ({
    code,
    message,
});
