import path from "path";
import dotenv from "dotenv";

// Load env before other app modules — static imports are hoisted and would
// construct GoogleGenAI / pg.Pool with an empty GEMINI_API_KEY / DATABASE_URL.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function ingest() {
    const { pool } = await import("../src/db/pool");
    const { listKnowledgeFiles, readKnowledgeFile } = await import("../src/rag/loader");
    const { chunkDocument } = await import("../src/rag/chunker");
    const { embedText } = await import("../src/rag/embedder");

    const files = listKnowledgeFiles();
    console.log(`Found ${files.length} knowledge files:`, files);

    for (const file of files) {
        const text = readKnowledgeFile(file);
        const chunks = chunkDocument(text);
        console.log(`  ${file}: ${chunks.length} chunks`);

        for (const chunk of chunks) {
            const embedding = await embedText(chunk.content);
            const vectorLiteral = `[${embedding.join(",")}]`;

            await pool.query(
                `INSERT INTO knowledge_documents (source_file, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4)`,
                [file, chunk.index, chunk.content, vectorLiteral]
            );
        }
    }

    console.log("Ingestion complete.");
    await pool.end();
}

ingest().catch((err) => {
    console.error("Ingestion failed:", err);
    process.exit(1);
});