import Link from "next/link";
import { ArrowLeft, HardHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center text-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <HardHat className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Halaman yang Anda tuju tidak tersedia atau rute telah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}

