"use client";

import React, { useState, useEffect } from "react";

const companies = [
  "PT. Maju Jaya",
  "PT. Sukses Makmur",
  "CV. Berkah Abadi",
  "PT. Global Teknologi",
  "PT. Sejahtera Bersama",
];

const products = [
  {
    name: "DS-11MK",
    type: "Entry Level",
    price: "Rp 1.245.000",
    desc: "Fingerprint & WiFi",
    tags: ["cloud", "fingerprint", "wifi"],
  },
  {
    name: "Vida W-2411M",
    type: "Mid Range",
    price: "Rp 2.944.500",
    desc: "Face Recognition & Touchscreen",
    tags: ["touch_app", "face", "wifi"],
  },
  {
    name: "REVO WFV-208BNC",
    type: "High End",
    price: "Rp 3.025.000",
    desc: "Fingerprint, Face & WiFi",
    tags: ["fingerprint", "face", "wifi"],
  },
];

const features = [
  {
    title: "Real-time Cloud Integration",
    desc: "Semua data absensi tersinkronisasi secara real-time ke cloud. Akses dari mana saja, kapan saja.",
    icon: "cloud_sync",
    span: "md:col-span-2",
  },
  {
    title: "Multi-Device Connectivity",
    desc: "Kelola semua perangkat absensi dari satu dashboard terpusat.",
    icon: "devices",
    span: "md:col-span-1",
  },
  {
    title: "Biometric Recognition Technology",
    desc: "Teknologi pengenalan biometrik canggih dengan akurasi tinggi untuk identifikasi karyawan yang cepat dan andal.",
    icon: "fingerprint",
    span: "md:col-span-1",
  },
  {
    title: "Enterprise Security",
    desc: "Enkripsi data end-to-end dan keamanan tingkat enterprise untuk melindungi data sensitif perusahaan Anda.",
    icon: "shield",
    span: "md:col-span-2",
  },
];

const testimonials = [
  {
    name: "Ahmad Rizky",
    role: "HR Manager, TechCorp",
    rating: 5,
    text: "Fingerspot mengubah cara kami mengelola absensi. Akurasi biometriknya luar biasa dan integrasi cloud-nya sangat mulus.",
  },
  {
    name: "Siti Nurhaliza",
    role: "Operations Director, LogiNet",
    rating: 5,
    text: "Kami menghemat 10 jam per minggu untuk administrasi absensi sejak menggunakan Fingerspot.",
  },
  {
    name: "Budi Santoso",
    role: "IT Lead, Manufaktur Jaya",
    rating: 4,
    text: "Perangkatnya tahan lama dan mudah dipasang. Support team juga responsif jika ada kendala teknis.",
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
      {/* Header / Nav */}
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
              <span className="text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#004ccd" }}>
                Fingerspot
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#solutions" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Solutions</a>
              <a href="#features" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-[#424656] hover:text-[#1a1c1c] transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <a href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium border border-[#c3c6d8] rounded-xl text-[#424656] hover:border-[#737687] transition-all">
                Login
              </a>
              <a href="/login" className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#0f62fe] hover:bg-[#004ccd] transition-all shadow-sm">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f62fe]/5 border border-[#0f62fe]/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#0f62fe]"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f62fe]"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide uppercase text-[#004ccd]">Solusi Absensi Modern</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Hanken Grotesk", letterSpacing: "-0.02em" }}>
                Precision Biometrics for the{" "}
                <span className="text-[#004ccd]">Modern Workforce.</span>
              </h1>
              <p className="text-lg text-[#424656] mb-8 max-w-lg leading-relaxed">
                Solusi Absensi Berbasis Cloud untuk Workforce Modern. Kelola kehadiran karyawan dengan mudah, cepat, dan akurat.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/login" className="px-6 py-3 text-sm font-semibold text-white rounded-xl bg-[#0f62fe] hover:bg-[#004ccd] transition-all shadow-lg shadow-[#0f62fe]/20">
                  Mulai Sekarang
                </a>
                <a href="#solutions" className="px-6 py-3 text-sm font-semibold border border-[#c3c6d8] rounded-xl text-[#424656] hover:border-[#737687] transition-all">
                  Pelajari Lebih Lanjut
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-80 h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-[#0f62fe]/10 flex items-center justify-center bg-gradient-to-br from-[#0f62fe]/5 to-[#0f62fe]/15 border border-[#0f62fe]/10">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-6 left-6 w-32 h-32 border-2 border-[#0f62fe] rounded-full"></div>
                  <div className="absolute bottom-10 right-10 w-48 h-48 border border-[#0f62fe] rounded-full"></div>
                </div>
                <span className="material-symbols-outlined text-[120px] text-[#0f62fe]/40 relative z-10">fingerprint</span>
                <div className="absolute bottom-6 left-6 right-6 text-[#424656] text-sm font-medium text-center">Biometric Identity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 px-6 lg:px-8 border-y border-[#c3c6d8]/30 bg-white/50">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-center text-sm font-medium text-[#737687] mb-8 uppercase tracking-wider">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {companies.map((name, i) => (
              <span key={i} className="text-lg font-bold text-[#c3c6d8] hover:text-[#737687] transition-colors" style={{ fontFamily: "Hanken Grotesk" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Showcase */}
      <section id="solutions" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              The <span className="text-[#004ccd]">Fingerspot</span> Ecosystem
            </h2>
            <p className="text-[#424656] max-w-2xl mx-auto">
              Pilihan perangkat biometrik terbaik untuk kebutuhan absensi perusahaan Anda.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <div
                key={i}
                className="relative group rounded-2xl border border-[#c3c6d8]/50 bg-white/60 backdrop-blur-md p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-xl bg-[#0f62fe]/5 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#004ccd]">devices</span>
                </div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-[#eeeeee] text-[#737687] mb-3">
                  {product.type}
                </span>
                <h3 className="text-lg font-bold text-[#1a1c1c] mb-2" style={{ fontFamily: "Hanken Grotesk" }}>
                  {product.name}
                </h3>
                <p className="text-sm text-[#737687] mb-4">{product.desc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#0f62fe]/20 text-[#004ccd] bg-[#0f62fe]/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#c3c6d8]/30">
                  <span className="text-xl font-bold text-[#004ccd]">{product.price}</span>
                  <button className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-[#0f62fe] hover:bg-[#004ccd] transition-opacity">
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cloud Integration */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f62fe]/5 border border-[#0f62fe]/20 mb-6">
                <span className="material-symbols-outlined text-lg text-[#004ccd]">cloud_sync</span>
                <span className="text-xs font-semibold text-[#004ccd]">Cloud Technology</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: "Hanken Grotesk" }}>
                Real-time Cloud Integration
              </h2>
              <p className="text-lg text-[#424656] mb-8 leading-relaxed">
                Semua data absensi tersinkronisasi secara real-time ke cloud. Pantau kehadiran karyawan dari mana saja melalui dashboard admin yang intuitif.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/login" className="px-6 py-3 text-sm font-semibold text-white rounded-xl bg-[#0f62fe] hover:bg-[#004ccd] transition-all">
                  Mulai Sekarang
                </a>
                <a href="#features" className="px-6 py-3 text-sm font-semibold border border-[#c3c6d8] rounded-xl text-[#424656] hover:border-[#737687] transition-all">
                  Pelajari Lebih Lanjut
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-[#0f62fe]/10 border border-[#c3c6d8]/30 bg-white">
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
                    <h4 className="text-sm font-semibold text-[#1a1c1c]">Absensi Hari Ini</h4>
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
                        <span className="text-xs text-[#1a1c1c]">{item}</span>
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

      {/* Features - Bento Grid */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              Fitur <span className="text-[#004ccd]">Unggulan</span>
            </h2>
            <p className="text-[#424656] max-w-2xl mx-auto">
              Fitur-fitur canggih yang dirancang untuk memenuhi kebutuhan workforce modern.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border border-[#c3c6d8]/50 bg-white/60 backdrop-blur-md p-8 shadow-sm hover:shadow-md transition-shadow ${feature.span}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#0f62fe]/5">
                  <span className="material-symbols-outlined text-2xl text-[#004ccd]">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-[#1a1c1c] mb-2" style={{ fontFamily: "Hanken Grotesk" }}>
                  {feature.title}
                </h3>
                <p className="text-[#424656] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              Trusted by <span className="text-[#004ccd]">Industry Leaders</span>
            </h2>
            <p className="text-[#424656] max-w-2xl mx-auto">
              Dipercaya oleh ribuan perusahaan di seluruh Indonesia.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#c3c6d8]/50 bg-white/60 backdrop-blur-md p-6 shadow-sm"
              >
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
                <p className="text-[#424656] mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[#0f62fe]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1a1c1c]">{t.name}</div>
                    <div className="text-xs text-[#737687]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="rounded-3xl p-12 sm:p-16 text-center text-white shadow-2xl bg-[#0f62fe]">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Hanken Grotesk" }}>
              Ready to Elevate Your Workspace?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg">
              Mulai transformasi digital absensi perusahaan Anda hari ini. Hubungi kami untuk demo gratis.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/login" className="px-8 py-3.5 bg-white font-semibold rounded-xl text-[#0f62fe] hover:bg-white/90 transition-all">
                Mulai Gratis
              </a>
              <a href="#" className="px-8 py-3.5 border-2 border-white/30 font-semibold rounded-xl text-white hover:bg-white/10 transition-all">
                Hubungi Sales
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
                Solusi absensi biometrik cerdas untuk workforce modern.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1c1c] mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Karir</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Kontak</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1c1c] mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Hardware</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Cloud Service</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Mobile App</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1c1c] mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">API Reference</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Panduan Setup</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Status Sistem</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1a1c1c] mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-[#737687] hover:text-[#424656] transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#c3c6d8]/20">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[#c3c6d8]">&copy; 2026 Fingerspot. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#c3c6d8] hover:text-[#737687] transition-colors">
                  <span className="material-symbols-outlined text-xl">language</span>
                </a>
                <a href="#" className="text-[#c3c6d8] hover:text-[#737687] transition-colors">
                  <span className="material-symbols-outlined text-xl">chat</span>
                </a>
                <a href="#" className="text-[#c3c6d8] hover:text-[#737687] transition-colors">
                  <span className="material-symbols-outlined text-xl">group</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
