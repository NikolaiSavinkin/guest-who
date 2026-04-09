import { error_schema } from "@shared/schema";
import type { SharedError } from "@shared/types";

export const parseSharedError = (json: unknown): SharedError | null => {
    const result = error_schema.safeParse(json);
    return result.success ? result.data : null;
};

export const errorMessageFromFailedResponse = (
    res: Response,
    json: unknown,
): string => {
    const shared = parseSharedError(json);
    return shared?.message ?? `Request failed (${res.status})`;
};
