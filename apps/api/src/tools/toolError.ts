export type ToolErrorCode = "INVALID_ARGUMENTS" | "NOT_FOUND" | "EXECUTION_ERROR";

export interface ToolError {
    error: true;
    code: ToolErrorCode;
    message: string;
}

export function toolError(code: ToolErrorCode, message: string): ToolError {
    return { error: true, code, message };
}