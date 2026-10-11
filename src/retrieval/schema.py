    from __future__ import annotations
    
    from dataclasses import dataclass, field
    
    @dataclass
    class RetrievedChunk:
        id: str
        text: str
        metadata: dict = field(default_factory=dict)
        score: float = 0.0  # cosine similarity (0..1)
