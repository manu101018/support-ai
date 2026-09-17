CREATE TABLE knowledge_documents (
    id SERIAL PRIMARY KEY,
    source_file TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_source ON knowledge_documents(source_file);