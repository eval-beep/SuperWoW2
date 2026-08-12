"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, lang, setTheme, setLang, t } = useThemeLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const NAV_ITEMS = [
    { href: "/dashboard", icon: "dashboard", labelKey: "dashboard" },
    { href: "/attendance-logs", icon: "history", labelKey: "attendance-logs" },
    { href: "/user-info", icon: "person", labelKey: "user-info" },
    { href: "/pin-list", icon: "password", labelKey: "pin-list" },
    { href: "/api-history", icon: "cloud_upload", labelKey: "api-history" },
    { href: "/webhook-history", icon: "cloud_download", labelKey: "webhook-history" },
    { href: "/api-tester", icon: "terminal", labelKey: "api-tester" },
    { href: "/settings", icon: "settings", labelKey: "settings" },
  ];

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    setHeaderSearch(q);
  }, [pathname]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!showThemeMenu) return;
    const close = () => setShowThemeMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showThemeMenu]);

  const closeSidebar = useCallback(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  const activeLabel = t(
    NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.labelKey || "dashboard"
  );

  return (
    <div className={cn("min-h-screen flex", theme === "dark" ? "bg-[#13131b]" : "bg-[#f9f9f9]")}>
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
          background: theme === "dark" ? "rgba(31, 31, 39, 0.95)" : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255, 255, 255, 0.3)"}`,
          boxShadow: theme === "dark" ? "0 0 0 1px rgba(70,69,84,0.3)" : "0 0 0 1px rgba(195, 198, 216, 0.3)",
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
            <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687", opacity: 0.7 }}>Enterprise Console</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "font-bold bg-[#dbe1ff]/20"
                    : "hover:bg-white/10"
                )}
                style={{
                  color: isActive ? "#004ccd" : (theme === "dark" ? "#c7c4d7" : "#424656"),
                  transform: isActive ? "scale(0.98)" : undefined,
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm" style={{ fontFamily: "Inter" }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t" style={{ borderColor: theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195, 198, 216, 0.2)" }}>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: theme === "dark" ? "rgba(41,41,50,0.8)" : "#f3f3f3" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#93f59e" }}>
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("admin")}</p>
              <p className="text-[10px] truncate" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("superAdmin")}</p>
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
            background: theme === "dark" ? "rgba(19, 19, 27, 0.85)" : "rgba(249, 249, 249, 0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255, 255, 255, 0.2)"}`,
            boxShadow: theme === "dark" ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>
              {activeLabel}
            </h2>
            <div className="relative hidden md:block flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>search</span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-full text-sm border-none focus:ring-2 focus:ring-[#004ccd]/30 transition-all"
                style={{
                  background: theme === "dark" ? "rgba(41,41,50,0.8)" : "#f3f3f3",
                  color: theme === "dark" ? "#e4e1ed" : "#1a1c1c",
                  fontFamily: "Inter",
                }}
                placeholder={t("search")}
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = new URL(window.location.href);
                    if (headerSearch) {
                      url.searchParams.set("q", headerSearch);
                    } else {
                      url.searchParams.delete("q");
                    }
                    router.push(url.pathname + url.search);
                  }
                }}
              />
              {headerSearch && (
                <button onClick={() => {
                  setHeaderSearch("");
                  const url = new URL(window.location.href);
                  url.searchParams.delete("q");
                  router.push(url.pathname + url.search);
                }} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors relative" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }}>
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#da1e28", border: `2px solid ${theme === "dark" ? "#13131b" : "#f9f9f9"}` }} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }}
              >
                <span className="material-symbols-outlined">{theme === "dark" ? "dark_mode" : "light_mode"}</span>
              </button>
              {showThemeMenu && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl py-2 min-w-[180px] shadow-lg z-50"
                  style={{
                    background: theme === "dark" ? "#292932" : "#ffffff",
                    border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.5)" : "rgba(195,198,216,0.3)"}`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setTheme("light"); setShowThemeMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                    style={{
                      color: theme === "dark" ? "#e4e1ed" : "#1a1c1c",
                      background: theme === "light" ? "rgba(0,76,205,0.12)" : "transparent",
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">light_mode</span>
                    {t("lightMode")}
                  </button>
                  <button
                    onClick={() => { setTheme("dark"); setShowThemeMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                    style={{
                      color: theme === "dark" ? "#e4e1ed" : "#1a1c1c",
                      background: theme === "dark" ? "rgba(192,193,255,0.1)" : "transparent",
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                    {t("darkMode")}
                  </button>
                  <div style={{ borderTop: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.2)"}`, margin: "4px 0" }} />
                  <button
                    onClick={() => { setLang("id"); setShowThemeMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                    style={{
                      color: theme === "dark" ? "#e4e1ed" : "#1a1c1c",
                      background: lang === "id" ? "rgba(0,76,205,0.12)" : "transparent",
                    }}
                  >
                    🇮🇩 {t("indonesian")}
                  </button>
                  <button
                    onClick={() => { setLang("en"); setShowThemeMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                    style={{
                      color: theme === "dark" ? "#e4e1ed" : "#1a1c1c",
                      background: lang === "en" ? "rgba(0,76,205,0.12)" : "transparent",
                    }}
                  >
                    🇬🇧 {t("english")}
                  </button>
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] mx-2" style={{ background: theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195, 198, 216, 0.3)" }} />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("admin")}</p>
                <p className="text-xs leading-none mt-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("superUser")}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 group-hover:border-[#004ccd] transition-colors" style={{ background: "#93f59e", borderColor: "rgba(219, 225, 255, 0.5)" }}>
                AD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 mx-auto w-full" style={{ maxWidth: "1440px" }}>
          {children}
        </main>

        <footer
          className="w-full py-4 flex flex-col sm:flex-row justify-between items-center px-8 gap-2"
          style={{ borderTop: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195, 198, 216, 0.2)"}`, background: theme === "dark" ? "#0d0d15" : "#ffffff" }}
        >
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase" style={{ fontFamily: "JetBrains Mono", letterSpacing: "0.1em", color: theme === "dark" ? "#c7c4d7" : "#424656" }}>
              Fingerspot Dashboard v2.4.0
            </span>
            <span style={{ color: theme === "dark" ? "rgba(199,196,215,0.3)" : "rgba(66, 70, 86, 0.3)" }}>|</span>
            <p className="text-xs font-medium" style={{ color: "#006e2b" }}>{t("systemStatus")}: {t("operational")}</p>
          </div>
          <div className="flex items-center gap-6">
            <a className="text-xs hover:underline transition-colors" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }} href="#">{t("documentation")}</a>
            <a className="text-xs hover:underline transition-colors" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }} href="#">{t("apiReference")}</a>
            <a className="text-xs hover:underline transition-colors" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656" }} href="#">{t("support")}</a>
            <span className="text-xs" style={{ color: theme === "dark" ? "#464554" : "#c3c6d8" }}>&copy; 2024 Fingerspot Enterprise</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
