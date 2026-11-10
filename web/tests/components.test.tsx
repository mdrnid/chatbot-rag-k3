import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmergencyBanner } from "../components/safety/EmergencyBanner";
import { CitationWarning } from "../components/safety/CitationWarning";
import { RefusalState } from "../components/safety/RefusalState";
import { SourceCard } from "../components/sources/SourceCard";
import { CitationChip } from "../components/chat/CitationChip";
import { useConversationStore } from "../stores/conversation";
import { Source } from "../lib/api/schemas";

const MOCK_SOURCE: Source = {
  id: "S1",
  label: "Kepmen ESDM 1827 K/30/MEM/2018",
  score: 0.92,
  cited: true,
  snippet: "Jarak aman terhadap manusia minimum 500 meter.",
  metadata: {
    status: "berlaku",
    doc_type: "regulasi",
    page_start: 157,
  },
};

const REVOKED_SOURCE: Source = {
  id: "S2",
  label: "Kepmen ESDM 555.K/26/M.PE/1995",
  score: 0.85,
  cited: true,
  snippet: "Ketentuan lama tentang bahan peledak.",
  metadata: {
    status: "dicabut",
    replaced_by: "Kepmen ESDM 1827 K/30/MEM/2018",
    doc_type: "regulasi",
  },
};

describe("K3 Safety & UI Components", () => {
  it("EmergencyBanner renders emergency notice and phone button", () => {
    render(
      <EmergencyBanner
        notice="🚨 KEADAAN DARURAT: Longsor di area tambang!"
        contact={{ name: "Tim ERT Site", phone: "112" }}
      />
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/Longsor di area tambang/)).toBeDefined();
    expect(screen.getByText(/Hubungi Langsung \(112\)/)).toBeDefined();
    expect(screen.getByText("Salin Nomor")).toBeDefined();
  });

  it("CitationWarning renders warning callout when citations are not verified", () => {
    render(<CitationWarning />);

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Peringatan: Verifikasi Sitasi Tidak Lengkap")).toBeDefined();
    expect(
      screen.getByText(/Harap verifikasi langsung ke dokumen fisik SOP\/Regulasi/)
    ).toBeDefined();
  });

  it("RefusalState renders clear rejection message without hallucination", () => {
    render(
      <RefusalState message="Maaf, informasi tentang harga amunisi tidak ada di dokumen." />
    );

    expect(screen.getByText("Informasi Tidak Ditemukan dalam Dokumen")).toBeDefined();
    expect(
      screen.getByText("Maaf, informasi tentang harga amunisi tidak ada di dokumen.")
    ).toBeDefined();
  });

  it("SourceCard displays 'DICABUT' badge in red for revoked documents", () => {
    render(<SourceCard source={REVOKED_SOURCE} />);

    expect(screen.getByText(/DICABUT → Digantikan oleh Kepmen ESDM 1827/)).toBeDefined();
  });

  it("CitationChip renders and opens SourcePanel on click", () => {
    const openSpy = vi.fn();
    useConversationStore.setState({ openSourcePanel: openSpy });

    render(
      <CitationChip
        sourceId="S1"
        sources={[MOCK_SOURCE]}
        sourcesLoaded={true}
      />
    );

    const chipButton = screen.getByRole("button", { name: /Buka rujukan sumber S1/ });
    expect(chipButton).toBeDefined();

    fireEvent.click(chipButton);
    expect(openSpy).toHaveBeenCalledWith("S1");
  });
});
