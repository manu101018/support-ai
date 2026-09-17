export interface Chunk {
    index: number;
    content: string
}

export interface Chunk {
    index: number;
    content: string;
}

/**
 * Simple paragraph-based chunking with a size cap.
 */
export function chunkDocument(text: string, maxChunkChars = 500): Chunk[] {
    const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    const chunks: Chunk[] = [];
    let current = "";

    for (const para of paragraphs) {
        if ((current + "\n\n" + para).length > maxChunkChars && current.length > 0) {
            chunks.push({ index: chunks.length, content: current.trim() });
            current = para;
        } else {
            current = current ? `${current}\n\n${para}` : para;
        }
    }
    if (current) {
        chunks.push({ index: chunks.length, content: current.trim() });
    }

    return chunks;
}