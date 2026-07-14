"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/attendance-logs", icon: "history", label: "Attendance Logs" },
  { href: "/user-info", icon: "person", label: "User Info" },
  { href: "/pin-list", icon: "password", label: "PIN List" },
  { href: "/api-tester", icon: "terminal", label: "API Tester" },
  { href: "/api-history", icon: "receipt_long", label: "API History" },
  { href: "/webhook-history", icon: "webhook", label: "Webhook History" },
  { href: "/settings", icon: "settings", label: "Pengaturan" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const closeSidebar = useCallback(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  return (
    <div className="min-h-screen flex" style={{ background: "#f9f9f9" }}>
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 w-[240px] h-screen z-[95]",
          "flex flex-col transition-transform duration-300",
          "lg:!translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 0 0 1px rgba(195, 198, 216, 0.3)",
        }}
      >
        <div className="px-4 py-5 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: "Hanken Grotesk", color: "#004ccd", letterSpacing: "-0.01em" }}>
              Fingerspot
            </h1>
            <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "JetBrains Mono", color: "#737687", opacity: 0.7 }}>Enterprise Console</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "font-bold text-[#004ccd] bg-[#dbe1ff]/20"
                    : "text-[#424656] hover:text-[#004ccd] hover:bg-white/10"
                )}
                style={isActive ? { transform: "scale(0.98)" } : {}}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm" style={{ fontFamily: "Inter" }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t" style={{ borderColor: "rgba(195, 198, 216, 0.2)" }}>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: "#f3f3f3" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#93f59e" }}>
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: "#1a1c1c" }}>Admin Utama</p>
              <p className="text-[10px] truncate" style={{ color: "#737687" }}>Super Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: isDesktop ? "240px" : "0px" }}
      >
        <header
          className="sticky top-0 z-[80] h-16 flex items-center justify-between px-8"
          style={{
            background: "rgba(249, 249, 249, 0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "#424656" }}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>
              {NAV_ITEMS.find(
                (i) => pathname === i.href || pathname.startsWith(i.href + "/")
              )?.label || "Dashboard"}
            </h2>
            <div className="relative hidden md:block flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "#737687" }}>search</span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-full text-sm border-none focus:ring-2 focus:ring-[#004ccd]/30 transition-all"
                style={{ background: "#f3f3f3", fontFamily: "Inter" }}
                placeholder="Cari data absensi..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors relative hover:bg-[#e8e8e8]" style={{ color: "#424656" }}>
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#da1e28", border: "2px solid #f9f9f9" }} />
            </button>
            <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[#e8e8e8]" style={{ color: "#424656" }}>
              <span className="material-symbols-outlined">settings</span>
            </Link>
            <div className="h-8 w-[1px] mx-2" style={{ background: "rgba(195, 198, 216, 0.3)" }} />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none" style={{ color: "#1a1c1c" }}>Admin Utama</p>
                <p className="text-xs leading-none mt-1" style={{ color: "#737687" }}>Superuser</p>
              </div>
              <img
                className="rounded-full border-2 group-hover:border-[#004ccd] transition-colors"
                style={{ borderColor: "rgba(219, 225, 255, 0.5)", width: 40, height: 40 }}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG4ryCzm4RrI_Zss0ORBZIb79LKJMeaNeOeYHlRaDsyFjrU55IbeAg5UVzjvGQpLaIuuwdq34QPtyEDMZmvjYq63aMlSWBkLaGuMYETBfCr67WYsM7ikElm5jX0N4YmYxMd-Dwk-QC73FLSuo3sCKn4i7qCiU6HSALk9vjezvxiuIZaVrcy-MpAIwI9lRJEuIRf6AkMTSlMPUHyvRMIxs_SaNO35EZzSEr1MgUc9gLdJirDZeKAXsDGNw6e1oKGd_I9zDllTU3__oQ"
                alt="Profile"
                width={40}
                height={40}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 mx-auto w-full" style={{ maxWidth: "1440px" }}>
          {children}
        </main>

        <footer
          className="w-full py-4 flex flex-col sm:flex-row justify-between items-center px-8 gap-2"
          style={{ borderTop: "1px solid rgba(195, 198, 216, 0.2)", background: "#ffffff" }}
        >
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase" style={{ fontFamily: "JetBrains Mono", letterSpacing: "0.1em", color: "#424656" }}>
              Fingerspot Dashboard v2.4.0
            </span>
            <span style={{ color: "rgba(66, 70, 86, 0.3)" }}>|</span>
            <p className="text-xs font-medium" style={{ color: "#006e2b" }}>System Status: Operational</p>
          </div>
          <div className="flex items-center gap-6">
            <a className="text-xs hover:underline transition-colors" style={{ color: "#424656" }} href="#">Documentation</a>
            <a className="text-xs hover:underline transition-colors" style={{ color: "#424656" }} href="#">API Reference</a>
            <a className="text-xs hover:underline transition-colors" style={{ color: "#424656" }} href="#">Support</a>
            <span className="text-xs" style={{ color: "#c3c6d8" }}>&copy; 2024 Fingerspot Enterprise</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
