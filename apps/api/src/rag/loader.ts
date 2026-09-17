import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve(__dirname, "../../../../knowledge");

export function listKnowledgeFiles(): string[] {
    return fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
}

export function readKnowledgeFile(filename: string): string {
    return fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), "utf-8");
}