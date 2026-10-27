import { describe, it, expect } from "vitest";
import { parseCitations, extractCitationIndices, hasCitations } from "../lib/citations";
import { Source } from "../lib/api/schemas";

const MOCK_SOURCES: Source[] = [
  {
    id: "S1",
    label: "Kepmen ESDM 1827 hal. 42",
    score: 0.95,
    cited: true,
    snippet: "Radius aman peledakan untuk manusia minimum 500m.",
    metadata: { doc_type: "regulasi", page_start: 42 },
  },
  {
    id: "S2",
    label: "SOP Peledakan Site hal. 10",
    score: 0.88,
    cited: true,
    snippet: "Pemeriksaan pasca peledakan menunggu minimum 15 menit.",
    metadata: { doc_type: "sop" },
  },
];

describe("Citation Parser (lib/citations.ts)", () => {
  it("should detect citations correctly with hasCitations", () => {
    expect(hasCitations("Teks tanpa sitasi")).toBe(false);
    expect(hasCitations("Radius 500m [S1]")).toBe(true);
    expect(hasCitations("Rujukan ganda [S1][S2]")).toBe(true);
  });

  it("should extract citation indices correctly", () => {
    expect(extractCitationIndices("Teks tanpa sitasi")).toEqual([]);
    expect(extractCitationIndices("Juru ledak [S1] memeriksa misfire [S2] dan [S1].")).toEqual([1, 2]);
    expect(extractCitationIndices("Gabungan [S3][S1]")).toEqual([1, 3]);
  });

  it("should parse single citation with valid source", () => {
    const text = "Radius aman peledakan adalah 500 meter [S1].";
    const segments = parseCitations(text, MOCK_SOURCES, true);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      type: "text",
      text: "Radius aman peledakan adalah 500 meter ",
    });
    expect(segments[1]).toMatchObject({
      type: "citation",
      raw: "[S1]",
      sourceId: "S1",
      citationIndex: 1,
      isValid: true,
      source: MOCK_SOURCES[0],
    });
    expect(segments[2]).toEqual({
      type: "text",
      text: ".",
    });
  });

  it("should parse adjacent citations like [S1][S2]", () => {
    const text = "Wajib patuh [S1][S2] sebelum blasting.";
    const segments = parseCitations(text, MOCK_SOURCES, true);

    expect(segments).toHaveLength(4);
    expect(segments[0]).toEqual({ type: "text", text: "Wajib patuh " });
    expect(segments[1]).toMatchObject({
      type: "citation",
      raw: "[S1]",
      sourceId: "S1",
      isValid: true,
    });
    expect(segments[2]).toMatchObject({
      type: "citation",
      raw: "[S2]",
      sourceId: "S2",
      isValid: true,
    });
    expect(segments[3]).toEqual({ type: "text", text: " sebelum blasting." });
  });

  it("should mark out-of-range citations as invalid", () => {
    const text = "Aturan tidak sah [S99].";
    const segments = parseCitations(text, MOCK_SOURCES, true);

    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({
      type: "citation",
      raw: "[S99]",
      sourceId: "S99",
      citationIndex: 99,
      isValid: false,
    });
  });

  it("should mark citation as pending when sources have not loaded yet", () => {
    const text = "Sedang generate [S1]...";
    const segments = parseCitations(text, [], false);

    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({
      type: "citation",
      raw: "[S1]",
      sourceId: "S1",
      isPending: true,
      isValid: true,
    });
  });
});
