"use client";

import React, { useState, useEffect } from "react";

const capabilities = [
  { tag: "CORE", title: "Analytics Lanjutan", icon: "monitoring" },
  { tag: "INFRA", title: "Sinkron Real-time", icon: "bolt" },
  { tag: "DEV", title: "API Terintegrasi", icon: "code" },
  { tag: "AUTO", title: "Webhook Cerdas", icon: "webhook" },
];

const features = [
  {
    title: "Analytics Lanjutan",
    desc: "Ubah data absensi mentah menjadi wawasan yang dapat ditindaklanjuti. Dashboard interaktif kami menyediakan laporan tren real-time, heatmap waktu kedatangan puncak, dan skor produktivitas otomatis.",
    tags: ["Live Tracking", "Ekspor CSV/PDF", "Prediksi Tren"],
    icons: ["monitoring", "file_download", "auto_graph"],
  },
];

const stats = [
  { value: "40%", label: "Penghematan Biaya HR", desc: "Otomasi pemrosesan penggajian mengurangi beban administrasi secara signifikan." },
  { value: "99.9%", label: "Uptime Dijamin", desc: "Infrastrategi kelas dunia menjamin ketersediaan tinggi dan latensi sub-detik global." },
  { value: "100%", label: "Akurasi Audit", desc: "Manajemen PIN dan template biometrik terpusat memastikan zero data leakage." },
];

const testimonials = [
  {
    name: "Ahmad Rizky",
    role: "HR Manager, TechCorp Indonesia",
    rating: 5,
    text: "Fingerspot mengubah cara kami melacak absensi multi-lokasi. Platform SaaS-nya intuitif, dan integrasi API dengan sistem penggajian kami sangat mudah.",
  },
  {
    name: "Siti Nurhaliza",
    role: "Operations Director, Nexa Corp",
    rating: 4,
    text: "Analytics real-time memberikan visibilitas tanpa precedent ke operasi cabang kami. Kami kini dapat mengoptimalkan level staf berdasarkan data traffic aktual.",
  },
  {
    name: "Budi Santoso",
    role: "Founder, Flow Creative",
    rating: 5,
    text: "Fingerspot bukan sekadar vendor software; mereka adalah mitra teknologi jangka panjang. Platform cloud-nya solid, aman, dan terus berkembang.",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl shadow-sm border-b border-[#c3c6d8]/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#0f62fe]">
                <span className="material-symbols-outlined text-white text-xl">fingerprint</span>
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#004ccd" }}>Fingerspot</span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Platform</a>
              <a href="#solusi" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Solusi</a>
              <a href="#fitur" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Fitur</a>
              <a href="#testimoni" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Testimoni</a>
            </nav>
            <div className="flex items-center gap-3">
              <a href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium border border-[#c3c6d8] rounded-xl text-[#424656] hover:border-[#737687] transition-all">
                Masuk
              </a>
              <a href="/login" className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#0f62fe] hover:bg-[#004ccd] transition-all shadow-sm">
                Mulai Sekarang
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f62fe]/5 border border-[#0f62fe]/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#0f62fe]"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f62fe]"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-[#004ccd]">Cloud-Native Intelligence</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Hanken Grotesk", letterSpacing: "-0.02em" }}>
              Unified Attendance Intelligence for the{" "}
              <span className="text-[#004ccd]">Modern Workforce.</span>
            </h1>
            <p className="text-lg text-[#424656] mb-8 max-w-2xl mx-auto leading-relaxed">
              Platform SaaS terpadu untuk pengelolaan workforce. Nikmati integrasi cloud mulus, analytics real-time, dan pelaporan otomatis yang dirancang untuk skala enterprise global Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/login" className="px-6 py-3 text-sm font-semibold text-white rounded-xl bg-[#0f62fe] hover:bg-[#004ccd] transition-all shadow-lg shadow-[#0f62fe]/20 flex items-center gap-2">
                Mulai Gratis <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
              <a href="#solusi" className="px-6 py-3 text-sm font-semibold border border-[#c3c6d8] rounded-xl text-[#424656] hover:border-[#737687] transition-all">
                Jadwalkan Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section id="platform" className="py-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: "Hanken Grotesk" }}>Kemampuan Platform</h2>
            <p className="text-[#424656] max-w-xl mx-auto">Satu pusat terpadu untuk semua data workforce Anda.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {capabilities.map((cap, i) => (
              <div key={i} className="rounded-xl p-5 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <span className="material-symbols-outlined text-3xl text-[#004ccd] mb-3">{cap.icon}</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737687] mb-1" style={{ fontFamily: "JetBrains Mono" }}>{cap.tag}</p>
                <p className="text-sm font-semibold" style={{ fontFamily: "Hanken Grotesk" }}>{cap.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Detail */}
      <section id="fitur" className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f62fe]/5 border border-[#0f62fe]/20 mb-4">
                <span className="material-symbols-outlined text-lg text-[#004ccd]">dashboard</span>
                <span className="text-xs font-semibold text-[#004ccd]">insights</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
                Analytics <span className="text-[#004ccd]">Lanjutan</span>
              </h2>
              <p className="text-[#424656] mb-6 leading-relaxed">
                Ubah data absensi mentah menjadi wawasan yang dapat ditindaklanjuti. Dashboard interaktif kami menyediakan laporan tren real-time, heatmap waktu kedatangan puncak, dan skor produktivitas otomatis.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {features[0].tags.map((tag, j) => (
                  <span key={j} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f3f3f3] text-[#424656]">
                    <span className="material-symbols-outlined text-[14px] text-[#004ccd]">{features[0].icons[j]}</span>
                    {tag}
                  </span>
                ))}
              </div>
              <a href="#solusi" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-[#c3c6d8] text-[#424656] hover:border-[#737687] transition-all">
                Jelajahi Modul <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[#c3c6d8]/30 bg-white">
                <div className="p-4 border-b border-[#c3c6d8]/20 bg-[#f9f9f9]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#da1e28]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffb3ad]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#93f59e]"></div>
                    <span className="ml-2 text-xs text-[#737687] font-mono">Dashboard</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold">Absensi Hari Ini</h4>
                    <span className="text-xs text-[#737687]">15 Jul 2026</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[#006e2b]/5 border border-[#006e2b]/10">
                      <div className="text-lg font-bold text-[#006e2b]">142</div>
                      <div className="text-[10px] text-[#737687] uppercase">Hadir</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#da1e28]/5 border border-[#da1e28]/10">
                      <div className="text-lg font-bold text-[#da1e28]">8</div>
                      <div className="text-[10px] text-[#737687] uppercase">Alpha</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f62fe]/5 border border-[#0f62fe]/10">
                      <div className="text-lg font-bold text-[#004ccd]">12</div>
                      <div className="text-[10px] text-[#737687] uppercase">Izin</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Ahmad Rizky - 08:00", "Siti Nurhaliza - 08:02", "Budi Santoso - 08:05"].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#f9f9f9]">
                        <span className="text-xs">{item}</span>
                        <span className="text-[10px] font-medium text-[#006e2b] bg-[#006e2b]/5 px-2 py-0.5 rounded-full">Masuk</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="text-4xl font-bold text-[#004ccd] mb-2" style={{ fontFamily: "Hanken Grotesk" }}>{stat.value}</div>
                <div className="text-sm font-semibold mb-2">{stat.label}</div>
                <p className="text-xs text-[#737687]">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              Keamanan <span className="text-[#004ccd]">Kelas Enterprise</span>
            </h2>
            <p className="text-[#424656] mb-8 leading-relaxed">
              Enkripsi militer untuk semua transit dan penyimpanan data. Sepenuhnya compliant dengan GDPR dan ISO 27001 untuk ketenangan pikiran Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: "security", label: "Enkripsi End-to-End" },
                { icon: "verified_user", label: "ISO 27001" },
                { icon: "privacy_tip", label: "GDPR Compliant" },
                { icon: "lock", label: "Zero Trust" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f3f3f3] text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px] text-[#004ccd]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: "Hanken Grotesk" }}>
              Dipercaya oleh <span className="text-[#004ccd]">Para Pemimpin Industri</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span
                      key={j}
                      className={`material-symbols-outlined text-xl ${j < t.rating ? "text-[#ffb300]" : "text-[#c3c6d8]"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-[#424656] mb-6 leading-relaxed text-sm">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[#0f62fe]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-[#737687]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="rounded-3xl p-12 sm:p-16 text-center text-white shadow-2xl bg-[#0f62fe]">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              Siap Meningkatkan Workspace Anda?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Bergabung dengan 5.000+ perusahaan yang mengoptimalkan absensi dan keamanan dengan platform Fingerspot.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/login" className="px-8 py-3.5 bg-white font-semibold rounded-xl text-[#0f62fe] hover:bg-white/90 transition-all">
                Mulai Gratis
              </a>
              <a href="#" className="px-8 py-3.5 border-2 border-white/30 font-semibold rounded-xl text-white hover:bg-white/10 transition-all">
                Jadwalkan Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c3c6d8]/30 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0f62fe]">
                  <span className="material-symbols-outlined text-white text-lg">fingerprint</span>
                </div>
                <span className="text-lg font-bold text-[#004ccd]" style={{ fontFamily: "Hanken Grotesk" }}>Fingerspot</span>
              </div>
              <p className="text-sm text-[#737687] leading-relaxed">
                Intelligence in every touch. Memimpin evolusi absensi terpadu dan pengelolaan workforce cloud secara global.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Karir</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Siaran Pers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Sumber Daya</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Pusat Dukungan</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Akses API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Syarat Layanan</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Kebijakan Cookie</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">support@fingerspot.io</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">+62 21 1234 5678</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#c3c6d8]/20">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6">
            <p className="text-sm text-[#c3c6d8] text-center">&copy; 2026 Fingerspot. All rights reserved. Workforce Intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
