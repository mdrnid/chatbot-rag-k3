import { Source } from "./api/schemas";

export type CitationSegment =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "citation";
      raw: string; // e.g. "[S1]"
      sourceId: string; // e.g. "S1"
      citationIndex: number; // e.g. 1
      source?: Source;
      isValid: boolean;
      isPending: boolean;
    };

/**
 * Parses markdown text containing citation markers like [S1], [S2], [S1][S3]
 * into an array of text and citation segments.
 *
 * @param text The response text to parse
 * @param sources List of sources returned from the backend (if any)
 * @param sourcesLoaded Flag indicating whether sources have arrived from SSE
 */
export function parseCitations(
  text: string,
  sources: Source[] = [],
  sourcesLoaded: boolean = false
): CitationSegment[] {
  if (!text) return [];

  // Regex to match citation tags like [S1], [S23]
  const citationRegex = /\[S(\d+)\]/g;
  const segments: CitationSegment[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const rawTag = match[0];
    const num = parseInt(match[1], 10);
    const sourceId = `S${num}`;

    // Add preceding text if non-empty
    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        text: text.slice(lastIndex, matchIndex),
      });
    }

    const matchedSource = sources.find((s) => s.id === sourceId);
    const isPending = !sourcesLoaded && sources.length === 0;
    const isValid = matchedSource ? true : isPending ? true : false;

    segments.push({
      type: "citation",
      raw: rawTag,
      sourceId,
      citationIndex: num,
      source: matchedSource,
      isValid,
      isPending,
    });

    lastIndex = matchIndex + rawTag.length;
  }

  // Add trailing text if any
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Extracts unique citation numbers from text (e.g. "[S1][S3]" -> [1, 3])
 */
export function extractCitationIndices(text: string): number[] {
  const citationRegex = /\[S(\d+)\]/g;
  const indices = new Set<number>();
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    indices.add(parseInt(match[1], 10));
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Checks if the text contains at least one citation marker [S#]
 */
export function hasCitations(text: string): boolean {
  return /\[S\d+\]/.test(text);
}
