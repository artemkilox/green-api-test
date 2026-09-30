import type { Credentials } from "../types";
import { normalizeApiUrl } from "./format";

export type CheckAccountResult = {
  exist?: boolean;
  chatId?: string;
  status?: boolean;
  reason?: string;
};

export type NotificationBody = {
  typeWebhook?: string;
  timestamp?: number;
  idMessage?: string;
  chatId?: string;
  status?: string;
  senderData?: {
    chatId?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
};

export type IncomingNotification = {
  receiptId: number;
  body: NotificationBody;
};

function instancePath(credentials: Credentials, method: string, extra = ""): string {
  const base = normalizeApiUrl(credentials.apiUrl);
  return `${base}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${extra}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 180) || `HTTP ${response.status}`);
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.message === "string" && data.message) {
      return data.message;
    }
    if (typeof data.reason === "string" && data.reason) {
      return data.reason;
    }
  }
  return fallback;
}

export async function getStateInstance(credentials: Credentials): Promise<string> {
  const response = await fetch(instancePath(credentials, "getStateInstance"));
  const payload = (await parseJson(response)) as { stateInstance?: string } | null;
  if (!response.ok) {
    throw new Error(errorMessage(payload, `GetStateInstance: HTTP ${response.status}`));
  }
  return payload?.stateInstance ?? "";
}

export async function setHttpApiSettings(credentials: Credentials): Promise<void> {
  const response = await fetch(instancePath(credentials, "setSettings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "",
      incomingWebhook: "yes",
      outgoingWebhook: "yes",
      outgoingAPIMessageWebhook: "yes",
      stateWebhook: "no",
    }),
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Не удалось сохранить настройки (${response.status})`));
  }
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
): Promise<CheckAccountResult> {
  const response = await fetch(instancePath(credentials, "checkAccount"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  const payload = (await parseJson(response)) as CheckAccountResult | null;
  if (!response.ok) {
    throw new Error(errorMessage(payload, `CheckAccount: HTTP ${response.status}`));
  }
  return payload ?? {};
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  const response = await fetch(instancePath(credentials, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });
  const payload = (await parseJson(response)) as { idMessage?: string } | null;
  if (!response.ok || !payload?.idMessage) {
    throw new Error(errorMessage(payload, `SendMessage: HTTP ${response.status}`));
  }
  return payload.idMessage;
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<IncomingNotification | null> {
  const url = `${instancePath(credentials, "receiveNotification")}?receiveTimeout=${receiveTimeout}`;
  const response = await fetch(url, { signal });
  if (response.status === 204) {
    return null;
  }
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, `ReceiveNotification: HTTP ${response.status}`));
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const data = payload as IncomingNotification;
  if (!data.receiptId || !data.body) {
    return null;
  }
  return data;
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  const response = await fetch(instancePath(credentials, "deleteNotification", `/${receiptId}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    const payload = await parseJson(response);
    throw new Error(errorMessage(payload, `DeleteNotification: HTTP ${response.status}`));
  }
}

export function extractText(body: NotificationBody): string {
  const type = body.messageData?.typeMessage;
  if (type === "extendedTextMessage") {
    return body.messageData?.extendedTextMessageData?.text?.trim() ?? "";
  }
  return body.messageData?.textMessageData?.textMessage?.trim() ?? "";
}

export function mapDeliveryStatus(status: string | undefined): "sent" | "delivered" | "read" | "failed" | null {
  if (status === "sent") {
    return "sent";
  }
  if (status === "delivered") {
    return "delivered";
  }
  if (status === "read") {
    return "read";
  }
  if (status === "failed" || status === "noAccount" || status === "notInGroup" || status === "suspended") {
    return "failed";
  }
  return null;
}
