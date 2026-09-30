import type { Chat, ChatMessage, Credentials, SessionMode } from "../types";

const KEY = "green-api-max-chat-v1";

export type PersistedState = {
  credentials: Credentials | null;
  mode: SessionMode | null;
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
  activeChatId: string | null;
};

const empty: PersistedState = {
  credentials: null,
  mode: null,
  chats: [],
  messages: {},
  activeChatId: null,
};

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return empty;
    }
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      credentials: parsed.credentials ?? null,
      mode: parsed.mode ?? null,
      chats: Array.isArray(parsed.chats) ? parsed.chats : [],
      messages: parsed.messages && typeof parsed.messages === "object" ? parsed.messages : {},
      activeChatId: parsed.activeChatId ?? null,
    };
  } catch {
    return empty;
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(KEY);
}
