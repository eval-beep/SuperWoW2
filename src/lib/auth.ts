export const AUTH_EMAIL = process.env.AUTH_EMAIL || "fingerspot@gmail.com";
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "admin123";

export const AUTH_COOKIE = "fs_session";

export function verifyCredentials(email: string, password: string): boolean {
  return email === AUTH_EMAIL && password === AUTH_PASSWORD;
}
