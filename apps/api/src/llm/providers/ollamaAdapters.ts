import { toolRegistry } from "../../tools/registry";

const typeMap: Record<string, string> = {
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    INTEGER: "integer",
    BOOLEAN: "boolean",
    ARRAY: "array",
};

function convertSchema(schema: any): any {
    if (!schema) return schema;
    const converted: any = {};

    if (schema.type) converted.type = typeMap[schema.type] ?? String(schema.type).toLowerCase();
    if (schema.description) converted.description = schema.description;
    if (schema.enum) converted.enum = schema.enum;
    if (schema.required) converted.required = schema.required;
    if (schema.items) converted.items = convertSchema(schema.items);

    if (schema.properties) {
        converted.properties = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            converted.properties[key] = convertSchema(value);
        }
    }

    return converted;
}

// Ollama/OpenAI-style tool array, built from the SAME registry Gemini uses
export function toOllamaTools() {
    return Object.values(toolRegistry).map((t) => ({
        type: "function",
        function: {
            name: t.declaration.name,
            description: t.declaration.description,
            parameters: convertSchema(t.declaration.parameters),
        },
    }));
}

// Strip Qwen3's internal reasoning trace before using the content
export function stripThinkTags(content: string): string {
    return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
