import { pool } from "../db/pool";
import { embedQuery } from "./embedder";

export interface RetrievedChunk {
    content: string;
    sourceFile: string;
    distance: number;
}

export async function searchKnowledge(query: string, topK = 3): Promise<RetrievedChunk[]> {
    const queryEmbedding = await embedQuery(query);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const result = await pool.query(
        `SELECT content, source_file, embedding <=> $1 AS distance
     FROM knowledge_documents
     ORDER BY embedding <=> $1
     LIMIT $2`,
        [vectorLiteral, topK]
    );

    return result.rows.map((row) => ({
        content: row.content,
        sourceFile: row.source_file,
        distance: parseFloat(row.distance),
    }));
}