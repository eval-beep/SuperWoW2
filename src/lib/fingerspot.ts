export interface FingerspotCommand {
  type: string;
  params: Record<string, unknown>;
}

export interface FingerspotResponse {
  success: boolean;
  status_code: number;
  data: Record<string, unknown>;
}

const ENDPOINT_MAP: Record<string, string> = {
  register_online: "reg_online",
};

export async function sendFingerspotCommand(
  command: string,
  params: Record<string, unknown>
): Promise<FingerspotResponse> {
  const apiUrl = process.env.FINGERSPOT_API_URL || "https://developer.fingerspot.io/api";
  const apiKey = process.env.FINGERSPOT_API_KEY || "";

  const endpoint = ENDPOINT_MAP[command] || command;
  const url = `${apiUrl}/${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json();

  const apiSuccess = res.ok && (data as Record<string, unknown>)?.success !== false;

  return {
    success: apiSuccess,
    status_code: res.status,
    data,
  };
}

export const COMMAND_TYPES = [
  "get_attlog",
  "get_userinfo",
  "get_all_pin",
  "set_userinfo",
  "delete_userinfo",
  "set_time",
  "register_online",
  "restart_device",
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];

export const COMMAND_META: Record<string, { icon: string; label: string; color: string }> = {
  get_attlog: { icon: "history", label: "Get Attendance Log", color: "tertiary" },
  get_userinfo: { icon: "person_search", label: "Get User Info", color: "primary" },
  get_all_pin: { icon: "pin", label: "Get All PIN", color: "secondary" },
  set_userinfo: { icon: "person_add", label: "Set User Info", color: "primary" },
  delete_userinfo: { icon: "person_remove", label: "Delete User Info", color: "error" },
  set_time: { icon: "schedule", label: "Set Time", color: "tertiary" },
  register_online: { icon: "wifi", label: "Register Online", color: "secondary" },
  restart_device: { icon: "restart_alt", label: "Restart Device", color: "tertiary" },
};
