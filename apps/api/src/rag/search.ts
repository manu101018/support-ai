import { pool } from "../db/pool";
import { embedQuery } from "./embedder";

export interface RetrievedChunk {
    content: string;
    sourceFile: string;
    heading: string;
    distance: number;
}

const RELEVANCE_THRESHOLD = 0.5; // chunks farther than this are treated as "not actually relevant"

export async function searchKnowledge(query: string, topK = 3): Promise<RetrievedChunk[]> {
    const queryEmbedding = await embedQuery(query);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const result = await pool.query(
        `SELECT content, source_file, heading, embedding <=> $1 AS distance
     FROM knowledge_documents
     ORDER BY embedding <=> $1
     LIMIT $2`,
        [vectorLiteral, topK]
    );

    console.log("[search debug]", result.rows.map(r => ({ heading: r.heading, distance: parseFloat(r.distance) })));
    return result.rows.map((row) => ({
        content: row.content,
        sourceFile: row.source_file,
        heading: row.heading,
        distance: parseFloat(row.distance),
    })).filter((chunk) => chunk.distance <= RELEVANCE_THRESHOLD);
}