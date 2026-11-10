# DESIGN.md — Sistem Desain & Visual BlastGuard AI

Dokumen ini adalah acuan resmi sistem desain antarmuka (*design system*) untuk **BlastGuard AI: Asisten K3 Peledakan Tambang Terbuka**.

---

## 1. Prinsip Desain & Filosofi K3

1. **Full-Viewport Hero (100vh) & Immersive Video:**
   * Hero Section menempati layar penuh satu viewport awal (`h-screen min-h-screen w-full`).
   * Video latar membentang penuh dari ujung atas layar hingga dasar (`absolute inset-0 w-full h-full object-cover`).
   * **Navbar Transparan Adaptif:** Berada di posisi `fixed top-0` dengan efek *frosted glass* (`bg-slate-950/25 backdrop-blur-md border-b border-white/10`) di atas video saat berada di puncak halaman, dan secara otomatis beradaptasi menjadi putih bersih saat pengguna menggulir ke section konten bawah.
   * **Gradien Halus di Dasar (Eased Alpha Mask):** Menggunakan teknik CSS `mask-image` dengan kurva *quartic falloff* (70% - 100% transisi ke 0) langsung pada kontainer video & overlay, bukan div gradien putih yang menimpa di atasnya. Hal ini menghilangkan efek kabut abu-abu (*milky haze/banding*) dan membuat video larut secara matematis ke latar belakang putih tanpa garis potong.
   * **Perilaku Scroll:** Saat di-scroll ke bawah, seluruh Hero Section (beserta video) ikut tergulung ke atas secara natural.
   * **Zero Bloat / YAGNI:** Tombol jeda/kontrol video dihapus total agar antarmuka bersih dan tidak ada elemen interaktif yang tidak esensial.

2. **Ergonomi Lapangan (High Legibility):**
   * Antarmuka wajib memiliki kontras tinggi yang jelas terbaca di bawah terik sinar matahari pit tambang.
   * Target sentuh minimal **44x44 px** agar ramah penggunaan di tablet/smartphone lapangan saat pekerja mengenakan sarung tangan.

3. **Disiplin Warna K3 (Safety Semantics):**
   * **Emerald (Hijau K3):** Aksen utama tombol aksi dan status berlaku dokumen.
   * **Amber (Kuning Keselamatan):** Peringatan operasional dan *Safety Disclaimer*.
   * **Rose / Merah Darurat:** Dibatasi ketat **hanya** untuk notifikasi bahaya darurat (*misfire*, gas, insiden) dan regulasi yang dicabut.
   * **Slate / Neutral:** Warna dasar latar belakang dan tipografi teks utama.

4. **Anti-Slop Copywriting & UI:**
   * Dilarang menggunakan judul yang hanya mengulang nama brand. Gunakan headline fungsi nyata.
   * Dilarang menggunakan jargon AI generik (*"Zero Hallucination"*, *"Cutting-edge AI"*, *"Revolutionary"*).
   * Dilarang mengulang hal yang sama dua kali (misal: metrik lingkaran dan kartu fitur yang isinya kembar).
   * Dilarang mengarang metrik palsu atau nomor pasal/halaman fiktif. Teks fokus pada instruksi kerja nyata pengawas dan juru ledak.

---

## 2. Token Desain (Design Tokens)

### 2.1 Palet Warna
```css
/* Netral */
--bg-page: #ffffff;          /* Pure White */
--bg-subtle: #f8fafc;        /* Slate 50 */
--border-subtle: #e2e8f0;    /* Slate 200 */
--text-primary: #0f172a;     /* Slate 900 */
--text-secondary: #475569;   /* Slate 600 */
--text-muted: #94a3b8;       /* Slate 400 */

/* Semantik K3 */
--brand-emerald: #059669;    /* Emerald 600 */
--brand-emerald-dark: #047857; /* Emerald 700 */
--brand-emerald-light: #ecfdf5; /* Emerald 50 */

--safety-amber: #d97706;     /* Amber 600 */
--safety-amber-bg: #fffbeb;  /* Amber 50 */

--emergency-rose: #e11d48;   /* Rose 600 */
--emergency-rose-bg: #fff1f2;/* Rose 50 */
```

---

## 3. Komponen Utama & Pola Layout

### 3.1 Navbar
* `fixed top-0 inset-x-0 z-50`
* Transisi dinamis: *Frosted Dark Glass* saat di puncak halaman → *Solid White Backdrop* saat scroll ke bawah.

### 3.2 Hero Section
* `h-screen min-h-screen w-full`
* Tipografi: Headline utama `"Rujukan K3 & Prosedur Peledakan Tambang Terbuka"`.
* 1 Tombol CTA terpusat `"Mulai Konsultasi K3"`.

### 3.3 Tiga Pilar Disiplin Sistem
* 3 kartu horizontal berjejer:
  1. **Sitasi Regulasi Transparan [S#]**
  2. **Prioritas Tanggap Darurat**
  3. **Penolakan Tanpa Asumsi**

### 3.4 Korpus Regulasi Terdaftar
* Grid 4 kartu dokumen resmi:
  1. `Kepmen ESDM No. 1827/2018`
  2. `Perkap / Perpol No. 17/2017`
  3. `Permen ESDM No. 26/2018`
  4. `SOP-BLS-04 Penanganan Misfire (fiktif)`

### 3.5 Simulasi Lapangan Interaktif
* Skenario nyata yang dapat dicoba langsung oleh pengguna.

### 3.6 Safety Disclaimer Banner
* Kotak peringatan hukum K3 mandiri sebelum footer.
