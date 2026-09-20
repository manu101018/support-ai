export interface Chunk {
    index: number;
    heading: string;
    content: string;
}

/**
 * Splits on markdown ## headings first (structural chunking), then
 * further splits any heading section that's still too large by paragraph.
 * Each chunk carries its heading as metadata — this is what lets the
 * model reason about WHAT KIND of policy content it's looking at,
 * not just raw text.
 */
export function chunkDocument(text: string, maxChunkChars = 500): Chunk[] {
    // Strip the top-level H1 title — it's document metadata, not chunkable content
    const withoutTitle = text.replace(/^#\s+.+$/m, "").trim();

    const sections = withoutTitle.split(/(?=^##\s)/m).filter((s) => s.trim().length > 0);
    const chunks: Chunk[] = [];

    for(const section of sections){
        const headingMatch = section.match(/^##\s+(.+)$/m);
        const heading = headingMatch ? headingMatch[1].trim() : "General";
        const body = section.replace(/^##\s+.+$/m, "").trim();

        if (body.length <= maxChunkChars) {
            chunks.push({ index: chunks.length, heading, content: body });
            continue;
        }

        // Section too large — fall back to paragraph splitting within it
        const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        let current = "";
        for (const para of paragraphs) {
            if ((current + "\n\n" + para).length > maxChunkChars && current.length > 0) {
                chunks.push({ index: chunks.length, heading, content: current.trim() });
                current = para;
            } else {
                current = current ? `${current}\n\n${para}` : para;
            }
        }
        if (current) chunks.push({ index: chunks.length, heading, content: current.trim() });
    }

    return chunks;
}