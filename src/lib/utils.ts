import { clsx, type ClassValue } from "clsx";

export const WIB_OFFSET = 7 * 60;

export function toWIB(date: string | Date): Date {
  const d = new Date(date);
  return new Date(d.getTime() + WIB_OFFSET * 60 * 1000 - d.getTimezoneOffset() * 60 * 1000);
}

export function toWIBISOString(date: string | Date): string {
  const d = toWIB(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}:${s}`;
}

export function getWIBDate(date: string | Date): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } {
  const d = toWIB(date);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
  };
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const { year, month, day } = getWIBDate(date);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function formatDateTime(date: string | Date): string {
  const { year, month, day, hours, minutes } = getWIBDate(date);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTime(date: string | Date): string {
  const { hours, minutes, seconds } = getWIBDate(date);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export function getStatusLabel(statusScan: number): string {
  return statusScan === 0 ? "Berhasil" : "Gagal";
}

export function getStatusClass(statusScan: number): string {
  return statusScan === 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
}

export function getVerifyLabel(code: number): string {
  const map: Record<number, string> = {
    1: "Finger",
    2: "Password",
    3: "Card",
    4: "Face",
    6: "Vein",
    7: "QR",
  };
  return map[code] || `Verify (${code})`;
}

export function getVerifyIcon(code: number): string {
  const map: Record<number, string> = {
    1: "fingerprint",
    2: "password",
    3: "credit_card",
    4: "face",
    6: "fingerprint",
    7: "qr_code_scanner",
  };
  return map[code] || "help";
}

export function getPrivilegeLabel(level: number): string {
  const map: Record<number, string> = {
    0: "User",
    1: "User",
    2: "Admin",
    3: "Super Admin",
  };
  return map[level] || "Unknown";
}

export function getPrivilegeColor(level: number): string {
  const map: Record<number, string> = {
    0: "bg-blue-100 text-blue-700",
    1: "bg-blue-100 text-blue-700",
    2: "bg-purple-100 text-purple-700",
    3: "bg-amber-100 text-amber-700",
  };
  return map[level] || "bg-gray-100 text-gray-700";
}
