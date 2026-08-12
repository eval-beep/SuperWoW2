export interface Pin {
  id: string;
  cloud_id: string;
  pin: string;
  name: string | null;
  privilege: number | null;
  enabled: string;
  verify: number;
  finger_count: number | null;
  face_count: number | null;
  rfid_count: number | null;
  vein_count: number | null;
  password_count: number | null;
  created_at: string;
  synced_at: string | null;
}

export interface Userinfo {
  id: string;
  cloud_id: string;
  pin: string;
  name: string;
  privilege: number;
  password: string;
  rfid: string;
  template: string;
  raw_payload: Record<string, unknown>;
  synced_at: string;
  created_at: string;
}

export interface Attlog {
  id: string;
  cloud_id: string;
  pin: string;
  name: string | null;
  scan_time: string;
  status_scan: number;
  verify_method: number;
  source: string;
  trans_id: string;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  api_token: string;
  cloud_id: string;
  api_url: string;
  theme: "light" | "dark" | "system";
  language: "id" | "en";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  lastPage: number;
  page: number;
  perPage: number;
}

export interface Stats {
  total: number;
  success?: number;
  failed?: number;
  pending?: number;
  today?: number;
  unique_employees?: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  nickname: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface OtpCode {
  id: string;
  user_id: string;
  email: string;
  code: string;
  purpose: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}
