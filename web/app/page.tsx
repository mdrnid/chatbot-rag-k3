"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowRight,
  Send,
  Bot,
  CircleDot,
  HardHat,
  BookOpen,
  CheckCircle2,
  Ban,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageLoading } from "@/components/ui/message-loading";

interface DemoAnswer {
  question: string;
  emergency: { icon: React.ReactNode; text: string } | null;
  body: string;
  points: string[];
  citations: { id: string; title: string }[];
}

const SOP_DEMOS: Record<string, DemoAnswer> = {
  misfire: {
    question: "Bagaimana prosedur penanganan lubang peledakan mangkir (misfire) di pit PT Aryagans?",
    emergency: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: "PERINGATAN DARURAT: Dilarang mendekati lubang ledak selama waktu tunggu berlangsung!",
    },
    body: "Sesuai prosedur internal SOP-AG-BLS-04 dan Kepmen ESDM No. 1827/2018 Lampiran II:",
    points: [
      "Pasang barikade isolasi dan rambu peringatan di seluruh akses menuju lokasi misfire.",
      "Patuhi waktu tunggu minimal sesuai instruksi tertulis KTT sebelum pemeriksaan area.",
      "Pemeriksaan hanya dapat dilakukan oleh Juru Ledak ber-KIM bersama Pengawas Peledakan.",
      "Dilarang menarik leg wire atau mengebor ulang lubang misfire.",
    ],
    citations: [
      { id: "S1", title: "SOP-AG-BLS-04 Penanganan Misfire (PT Aryagans)" },
      { id: "S2", title: "Kepmen ESDM 1827 K/30/MEM/2018 Lamp. II" },
    ],
  },
  gudang_handak: {
    question: "Apa saja ketentuan pengamanan gudang bahan peledak di site PT Aryagans?",
    emergency: null,
    body: "Berdasarkan Perkap/Perpol No. 17 Tahun 2017 dan Kepmen ESDM No. 1827/2018 Lampiran II:",
    points: [
      "Gudang bahan peledak wajib dijaga 24 jam oleh petugas satuan pengamanan bersertifikat.",
      "Detonator wajib disimpan terpisah dari bahan peledak peka primer (ANFO dan dinamit).",
      "Petugas wajib mencatat setiap penerimaan dan pengeluaran bahan peledak di buku register.",
      "Area gudang wajib memiliki tanggul pengaman, kawat duri, dan instalasi penangkal petir teruji.",
    ],
    citations: [
      { id: "S1", title: "Perkap/Perpol No. 17 Tahun 2017" },
      { id: "S2", title: "Kepmen ESDM 1827 K/30/MEM/2018 Lamp. II" },
    ],
  },
  regulasi_dicabut: {
    question: "Apakah Permen ESDM No. 38 Tahun 2014 masih berlaku untuk pedoman SMKP?",
    emergency: null,
    body: "STATUS REGULASI: Permen ESDM No. 38 Tahun 2014 berstatus TELAH DICABUT.",
    points: [
      "Permen ESDM No. 38 Tahun 2014 tentang Penerapan SMKP Minerba sudah tidak berlaku.",
      "Regulasi pengganti yang sah adalah Permen ESDM No. 26 Tahun 2018 tentang Kaidah Pertambangan yang Baik.",
      "Pedoman teknis keselamatan peledakan mengacu pada Kepmen ESDM No. 1827 K/30/MEM/2018.",
    ],
    citations: [
      { id: "S1", title: "Permen ESDM No. 38 Tahun 2014 (Status: Dicabut)" },
      { id: "S2", title: "Permen ESDM No. 26 Tahun 2018 (Pengganti)" },
    ],
  },
  penolakan: {
    question: "Berapa standar gaji atau bonus tahunan untuk kru peledakan pit PT Aryagans?",
    emergency: null,
    body: "Informasi tidak ditemukan di dalam korpus dokumen teknis K3.",
    points: [
      "Sistem ini hanya melayani pertanyaan teknis K3, regulasi ESDM/Polri, dan SOP peledakan site.",
      "Pertanyaan perihal struktur penggajian dan administrasi personalia berada di luar wewenang sistem.",
    ],
    citations: [],
  },
};

const QUICK_CHIPS = [
  { key: "misfire", label: "Penanganan Misfire" },
  { key: "gudang_handak", label: "Gudang Handak" },
  { key: "regulasi_dicabut", label: "Uji Regulasi Dicabut" },
  { key: "penolakan", label: "Uji Penolakan Bot" },
];

const DISCIPLINE_PILLARS = [
  {
    icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
    title: "Sitasi Regulasi Wajib [S#]",
    desc: "Setiap instruksi langsung mencantumkan dokumen dan pasal resmi. Pengawas dapat langsung memverifikasi aturan ke sumber sah.",
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    title: "Prioritas Tanggap Darurat",
    desc: "Kondisi darurat seperti lubang ledak mangkir (misfire) langsung menampilkan peringatan perimeter sebelum instruksi lainnya.",
  },
  {
    icon: <Ban className="h-6 w-6 text-rose-600" />,
    title: "Penolakan Tanpa Asumsi",
    desc: "Sistem menolak menjawab jika informasi tidak tercantum di dokumen resmi. Hal ini mencegah spekulasi berbahaya di pit.",
  },
];

const SHOWCASE_DOCUMENTS = [
  {
    badge: "Kepmen 1827/2018",
    title: "Kepmen ESDM No. 1827/2018",
    sub: "Kaidah Teknik Pertambangan (Lampiran II)",
    status: "Berlaku • Pedoman Teknis Peledakan",
  },
  {
    badge: "Perpol 17/2017",
    title: "Perkap / Perpol No. 17/2017",
    sub: "Pengamanan Bahan Peledak Komersial",
    status: "Berlaku • Standar Pengamanan Polri",
  },
  {
    badge: "Permen 26/2018",
    title: "Permen ESDM No. 26/2018",
    sub: "Kaidah Pertambangan yang Baik & Pengawasan",
    status: "Berlaku • Regulasi Payung SMKP",
  },
  {
    badge: "SOP Internal",
    title: "SOP-AG-BLS-04 Penanganan Misfire",
    sub: "Prosedur Standar Lubang Ledak Mangkir",
    status: "SOP Site PT Aryagans",
  },
];

function ChatDemoWidget() {
  const [activeKey, setActiveKey] = useState("misfire");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; data: DemoAnswer }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const loadScenario = useCallback(
    (key: string, animated = true) => {
      const data = SOP_DEMOS[key];
      if (!data) return;
      setActiveKey(key);

      if (!animated) {
        setMessages([{ role: "user", data }, { role: "ai", data }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "user", data }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: "ai", data }]);
        setTimeout(scrollToBottom, 50);
      }, 500);
    },
    [scrollToBottom]
  );

  useEffect(() => {
    loadScenario("misfire", false);
  }, [loadScenario]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleChipClick = (key: string) => {
    loadScenario(key, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");

    const lower = text.toLowerCase();
    let matchKey = "misfire";
    if (lower.includes("gudang") || lower.includes("handak") || lower.includes("simpan")) matchKey = "gudang_handak";
    else if (lower.includes("38") || lower.includes("smkp") || lower.includes("cabut") || lower.includes("lama")) matchKey = "regulasi_dicabut";
    else if (lower.includes("gaji") || lower.includes("bonus") || lower.includes("uang") || lower.includes("luar")) matchKey = "penolakan";
    else if (lower.includes("misfire") || lower.includes("mangkir") || lower.includes("gagal")) matchKey = "misfire";

    loadScenario(matchKey, true);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900">Simulasi Rujukan K3 PT Aryagans</span>
          </div>
        </div>
        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Grounded RAG
        </span>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleChipClick(chip.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                activeKey === chip.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto bg-slate-50/50 px-4 py-4"
        style={{ minHeight: 290, maxHeight: 330 }}
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div
              key={i}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm"
            >
              {msg.data.question}
            </div>
          ) : (
            <div
              key={i}
              className="mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-800 shadow-sm"
            >
              {msg.data.emergency && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-2.5 py-1.5">
                  <span className="mt-0.5 text-amber-600">{msg.data.emergency.icon}</span>
                  <span className="text-[11px] font-bold text-amber-950">{msg.data.emergency.text}</span>
                </div>
              )}
              <p className="font-semibold text-slate-900">{msg.data.body}</p>
              <ul className="mt-2 space-y-1 pl-3.5">
                {msg.data.points.map((pt, j) => (
                  <li key={j} className="list-disc text-slate-600">
                    {pt}
                  </li>
                ))}
              </ul>
              {msg.data.citations.length > 0 ? (
                <div className="mt-2.5 border-t border-slate-100 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rujukan Dokumen:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {msg.data.citations.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
                      >
                        <strong className="text-emerald-700">[{c.id}]</strong>
                        {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] italic text-slate-400">
                  Tidak ada sitasi (ditolak karena di luar korpus dokumen resmi)
                </div>
              )}
            </div>
          )
        )}

        {isTyping && (
          <div className="mr-auto flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-slate-200 text-xs text-slate-500 shadow-sm">
            <MessageLoading className="h-4 w-4 text-emerald-600" />
            <span className="text-[11px] font-medium">Memeriksa dokumen...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Tanyakan SOP misfire, izin handak..."
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white"
        />
        <button
          type="submit"
          aria-label="Kirim pertanyaan"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {});
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar: Transparan Blur over video, adaptif saat scroll */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          isScrolled
            ? "border-b border-slate-200/80 bg-white/85 text-slate-900 backdrop-blur-md shadow-sm"
            : "border-b border-white/10 bg-slate-950/25 text-white backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-colors",
                isScrolled
                  ? "bg-slate-900 text-white"
                  : "bg-white/15 border border-white/20 text-white"
              )}
            >
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-extrabold tracking-tight leading-none">
                PT ARYAGANS
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-wider uppercase",
                  isScrolled ? "text-emerald-700" : "text-emerald-300"
                )}
              >
                BlastGuard K3
              </span>
            </div>
          </div>

          <nav
            className={cn(
              "hidden items-center gap-8 text-xs font-semibold md:flex transition-colors",
              isScrolled ? "text-slate-600" : "text-slate-200"
            )}
          >
            <a href="#prinsip" className={isScrolled ? "hover:text-slate-900 transition" : "hover:text-white transition"}>
              Prinsip Sistem
            </a>
            <a href="#regulasi" className={isScrolled ? "hover:text-slate-900 transition" : "hover:text-white transition"}>
              Regulasi & SOP Site
            </a>
            <a href="#simulasi" className={isScrolled ? "hover:text-slate-900 transition" : "hover:text-white transition"}>
              Simulasi Pit
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95",
                isScrolled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-white text-slate-950 hover:bg-slate-100"
              )}
            >
              <span>Buka Asisten K3</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: FULL SCREEN VIEWPORT (100vh) dengan Video Background & Transisi Masking Halus */}
      <section
        id="beranda"
        className="relative h-screen min-h-screen w-full overflow-hidden bg-white text-white flex flex-col justify-center items-center text-center px-4"
      >
        {/* Background video layer dengan Eased Alpha Mask (menghilangkan garis potong / kabut abu-abu) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0.92) 76%, rgba(0,0,0,0.75) 83%, rgba(0,0,0,0.5) 89%, rgba(0,0,0,0.25) 94%, rgba(0,0,0,0.08) 98%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0.92) 76%, rgba(0,0,0,0.75) 83%, rgba(0,0,0,0.5) 89%, rgba(0,0,0,0.25) 94%, rgba(0,0,0,0.08) 98%, rgba(0,0,0,0) 100%)",
          }}
          aria-hidden="true"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/background-landingpage.mp4" type="video/mp4" />
          </video>

          {/* Cinematic dark overlay */}
          <div className="absolute inset-0 bg-slate-950/45" />
        </div>

        {/* Hero Content: Centered bold typography */}
        <div className="relative z-20 max-w-3xl mx-auto px-4 pt-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight drop-shadow-md">
            Portal K3 & Prosedur Peledakan Tambang PT Aryagans
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Akses cepat Kepmen ESDM 1827/2018, Perpol 17/2017, dan SOP internal untuk Pengawas Operasional
            dan Juru Ledak di pit. Sistem menyajikan jawaban dengan sitasi pasal resmi.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 hover:scale-105 active:scale-95"
            >
              <span>Masuk ke Portal K3</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: 3 Disiplin Sistem (Horizontal 3-Cards, Tanpa Duplikasi) */}
      <section id="prinsip" className="py-16 sm:py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Disiplin Keselamatan & Batasan Sistem
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Operasional peledakan pit PT Aryagans memerlukan kepastian aturan. Sistem ini hanya menjawab dari dokumen resmi yang terdaftar.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {DISCIPLINE_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Regulasi & SOP Terdaftar (Showcase Cards) */}
      <section id="regulasi" className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Regulasi Nasional & SOP Site Terdaftar
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Dokumen resmi yang diindeks dan diverifikasi dalam sistem rujukan internal PT Aryagans.
              </p>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-emerald-700 transition"
            >
              <span>Uji di Chatbot</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_DOCUMENTS.map((doc, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200 transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                    {doc.badge}
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {doc.sub}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-emerald-800 flex items-center justify-between">
                  <span>{doc.status}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Simulasi Interaktif Lapangan */}
      <section id="simulasi" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Simulasi Operasional Pit
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Verifikasi Respon Sesuai Standar Operasional
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Pilih skenario simulasi untuk melihat cara sistem memvalidasi prosedur lubang mangkir (misfire),
                pengamanan gudang handak, status regulasi dicabut, dan penolakan otomatis.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>SOP penanganan misfire merujuk SOP-AG-BLS-04 dan Kepmen ESDM 1827/2018.</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Ketentuan pengamanan gudang handak merujuk Perpol 17/2017 dan Kepmen 1827/2018.</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sistem otomatis menolak menjawab jika topik berada di luar korpus keselamatan tambang.</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <span>Buka Konsultasi K3 Lengkap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div>
              <ChatDemoWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Safety Disclaimer Hukum K3 */}
      <section className="border-t border-slate-200 bg-amber-50/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                Pemberitahuan Keselamatan Hukum (Safety Disclaimer)
              </h3>
              <p className="mt-1 text-xs text-amber-900 leading-relaxed max-w-4xl">
                Asisten K3 Peledakan ini adalah <strong>alat bantu rujukan teknis cepat</strong>. Sistem bukan
                pengganti Standar Operasional Prosedur (SOP) tertulis perusahaan, izin tertulis, atau wewenang penuh
                Kepala Teknik Tambang (KTT) dan Juru Ledak bersertifikat KIM PT Aryagans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>PT ARYAGANS • BlastGuard K3 Portal Operasional Peledakan</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#beranda" className="hover:text-slate-900 transition">Kembali ke Atas</a>
            <span>•</span>
            <Link href="/chat" className="text-emerald-700 font-semibold hover:underline">
              Buka Asisten K3
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
