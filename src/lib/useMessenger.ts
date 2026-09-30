import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createDemoChats, demoReply } from "./demo";
import {
  checkAccount,
  deleteNotification,
  extractText,
  getStateInstance,
  mapDeliveryStatus,
  receiveNotification,
  sendMessage,
  setHttpApiSettings,
  type NotificationBody,
} from "./greenApi";
import { formatPhone, normalizeApiUrl, toMillis, toPhoneNumber } from "./format";
import { clearState, loadState, saveState } from "./storage";
import type { Chat, ChatMessage, Credentials, SessionMode } from "../types";

type State = {
  credentials: Credentials | null;
  mode: SessionMode | null;
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
  activeChatId: string | null;
  connecting: boolean;
  error: string | null;
};

type Action =
  | { type: "hydrate"; payload: State }
  | { type: "boot_start" }
  | { type: "boot_ok"; credentials: Credentials | null; mode: SessionMode; chats?: Chat[]; messages?: Record<string, ChatMessage[]> }
  | { type: "boot_fail"; error: string }
  | { type: "logout" }
  | { type: "set_error"; error: string | null }
  | { type: "set_active"; chatId: string | null }
  | { type: "upsert_chat"; chat: Chat }
  | { type: "add_message"; message: ChatMessage; incrementUnread: boolean }
  | { type: "patch_message"; chatId: string; fromId: string; patch: Partial<ChatMessage> }
  | { type: "clear_unread"; chatId: string };

const initial: State = {
  credentials: null,
  mode: null,
  chats: [],
  messages: {},
  activeChatId: null,
  connecting: false,
  error: null,
};

function sortChats(chats: Chat[], messages: Record<string, ChatMessage[]>): Chat[] {
  return [...chats].sort((a, b) => {
    const ta = messages[a.id]?.at(-1)?.timestamp ?? 0;
    const tb = messages[b.id]?.at(-1)?.timestamp ?? 0;
    return tb - ta;
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "boot_start":
      return { ...state, connecting: true, error: null };
    case "boot_ok": {
      const chats = action.chats ?? state.chats;
      const messages = action.messages ?? state.messages;
      return {
        ...state,
        connecting: false,
        error: null,
        credentials: action.credentials,
        mode: action.mode,
        chats: sortChats(chats, messages),
        messages,
      };
    }
    case "boot_fail":
      return { ...state, connecting: false, error: action.error, credentials: null, mode: null };
    case "logout":
      return { ...initial };
    case "set_error":
      return { ...state, error: action.error };
    case "set_active":
      return {
        ...state,
        activeChatId: action.chatId,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId ? { ...chat, unread: 0 } : chat,
        ),
      };
    case "upsert_chat": {
      const exists = state.chats.some((chat) => chat.id === action.chat.id);
      const chats = exists
        ? state.chats.map((chat) => (chat.id === action.chat.id ? { ...chat, ...action.chat } : chat))
        : [action.chat, ...state.chats];
      return { ...state, chats: sortChats(chats, state.messages) };
    }
    case "add_message": {
      const list = state.messages[action.message.chatId] ?? [];
      if (list.some((item) => item.id === action.message.id)) {
        return state;
      }
      const messages = {
        ...state.messages,
        [action.message.chatId]: [...list, action.message],
      };
      const chats = state.chats.map((chat) => {
        if (chat.id !== action.message.chatId) {
          return chat;
        }
        const unread =
          action.incrementUnread && state.activeChatId !== chat.id ? chat.unread + 1 : chat.unread;
        return { ...chat, unread };
      });
      return { ...state, messages, chats: sortChats(chats, messages) };
    }
    case "patch_message": {
      const list = state.messages[action.chatId];
      if (!list) {
        return state;
      }
      const messages = {
        ...state.messages,
        [action.chatId]: list.map((item) =>
          item.id === action.fromId ? { ...item, ...action.patch } : item,
        ),
      };
      return { ...state, messages };
    }
    case "clear_unread":
      return {
        ...state,
        chats: state.chats.map((chat) => (chat.id === action.chatId ? { ...chat, unread: 0 } : chat)),
      };
    default:
      return state;
  }
}

function persistable(state: State) {
  return {
    credentials: state.credentials,
    mode: state.mode,
    chats: state.chats,
    messages: state.messages,
    activeChatId: state.activeChatId,
  };
}

function chatTitle(body: NotificationBody, chatId: string): string {
  const name = body.senderData?.senderContactName || body.senderData?.senderName;
  if (name) {
    return name;
  }
  const sender = body.senderData?.sender ?? chatId;
  return formatPhone(sender.replace(/@c\.us$/, ""));
}

export function useMessenger() {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadState();
    dispatch({
      type: "hydrate",
      payload: {
        ...initial,
        credentials: saved.credentials,
        mode: saved.mode,
        chats: saved.chats,
        messages: saved.messages,
        activeChatId: saved.activeChatId,
      },
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    saveState(persistable(state));
  }, [ready, state.credentials, state.mode, state.chats, state.messages, state.activeChatId]);

  const applyNotification = useCallback((body: NotificationBody) => {
    if (body.typeWebhook === "outgoingMessageStatus") {
      const chatId = body.chatId;
      const idMessage = body.idMessage;
      const status = mapDeliveryStatus(body.status);
      if (!chatId || !idMessage || !status) {
        return;
      }
      dispatch({ type: "patch_message", chatId, fromId: idMessage, patch: { status } });
      return;
    }

    if (body.typeWebhook !== "incomingMessageReceived") {
      return;
    }

    const text = extractText(body);
    if (!text) {
      return;
    }
    const chatId = body.senderData?.chatId || body.chatId;
    if (!chatId) {
      return;
    }
    const current = stateRef.current;
    if (!current.chats.some((chat) => chat.id === chatId)) {
      dispatch({
        type: "upsert_chat",
        chat: { id: chatId, title: chatTitle(body, chatId), unread: 0 },
      });
    }
    dispatch({
      type: "add_message",
      incrementUnread: true,
      message: {
        id: body.idMessage || `${chatId}-${body.timestamp ?? Date.now()}`,
        chatId,
        text,
        timestamp: toMillis(body.timestamp ?? Date.now()),
        outgoing: false,
      },
    });
  }, []);

  useEffect(() => {
    if (state.mode !== "live" || !state.credentials) {
      return;
    }
    void setHttpApiSettings(state.credentials).catch((error: unknown) => {
      dispatch({
        type: "set_error",
        error: error instanceof Error ? error.message : "Не удалось применить настройки инстанса",
      });
    });
  }, [state.mode, state.credentials]);

  useEffect(() => {
    if (state.mode !== "live" || !state.credentials) {
      return;
    }
    const credentials = state.credentials;
    const abort = new AbortController();
    const loop = async () => {
      while (!abort.signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, 20, abort.signal);
          if (abort.signal.aborted) {
            return;
          }
          if (!notification) {
            continue;
          }
          applyNotification(notification.body);
          await deleteNotification(credentials, notification.receiptId);
        } catch (error) {
          if (abort.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
            return;
          }
          const message = error instanceof Error ? error.message : "Ошибка получения сообщений";
          dispatch({ type: "set_error", error: message });
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
    };
    void loop();
    return () => abort.abort();
  }, [state.mode, state.credentials, applyNotification]);

  const login = useCallback(async (raw: Credentials) => {
    dispatch({ type: "boot_start" });
    const credentials: Credentials = {
      apiUrl: normalizeApiUrl(raw.apiUrl),
      idInstance: raw.idInstance.trim(),
      apiTokenInstance: raw.apiTokenInstance.trim(),
    };
    if (!credentials.apiUrl || !credentials.idInstance || !credentials.apiTokenInstance) {
      dispatch({ type: "boot_fail", error: "Заполните apiUrl, idInstance и apiTokenInstance" });
      return;
    }
    try {
      const instanceState = await getStateInstance(credentials);
      if (instanceState && instanceState !== "authorized") {
        dispatch({
          type: "boot_fail",
          error: `Инстанс не авторизован в MAX (${instanceState})`,
        });
        return;
      }
      await setHttpApiSettings(credentials);
      dispatch({ type: "boot_ok", credentials, mode: "live" });
    } catch (error) {
      dispatch({
        type: "boot_fail",
        error: error instanceof Error ? error.message : "Не удалось войти",
      });
    }
  }, []);

  const enterDemo = useCallback(() => {
    const seed = createDemoChats();
    dispatch({
      type: "boot_ok",
      credentials: null,
      mode: "demo",
      chats: seed.chats,
      messages: seed.messages,
    });
    dispatch({ type: "set_active", chatId: seed.chats[0].id });
  }, []);

  const logout = useCallback(() => {
    clearState();
    dispatch({ type: "logout" });
  }, []);

  const openChat = useCallback((chatId: string | null) => {
    dispatch({ type: "set_active", chatId });
    if (chatId) {
      dispatch({ type: "clear_unread", chatId });
    }
  }, []);

  const createChat = useCallback(async (phoneInput: string) => {
    const phone = toPhoneNumber(phoneInput);
    if (!phone) {
      throw new Error("Номер: 11 цифр для РФ или 12 для РБ, международный формат");
    }
    const current = stateRef.current;
    if (current.mode === "demo") {
      const chatId = `demo-${phone}`;
      dispatch({
        type: "upsert_chat",
        chat: { id: chatId, title: formatPhone(String(phone)), phone: String(phone), unread: 0 },
      });
      dispatch({ type: "set_active", chatId });
      return;
    }
    if (!current.credentials) {
      throw new Error("Нет сессии GREEN-API");
    }
    const result = await checkAccount(current.credentials, phone);
    if (result.reason) {
      throw new Error(result.reason);
    }
    if (!result.exist || !result.chatId) {
      throw new Error("На этом номере нет MAX");
    }
    dispatch({
      type: "upsert_chat",
      chat: {
        id: result.chatId,
        title: formatPhone(String(phone)),
        phone: String(phone),
        unread: 0,
      },
    });
    dispatch({ type: "set_active", chatId: result.chatId });
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: "set_error", error: null });
  }, []);

  const send = useCallback(async (text: string) => {
    const value = text.trim();
    const current = stateRef.current;
    const chatId = current.activeChatId;
    if (!value || !chatId) {
      return;
    }
    const localId = `local-${Date.now()}`;
    const message: ChatMessage = {
      id: localId,
      chatId,
      text: value,
      timestamp: Date.now(),
      outgoing: true,
      status: "pending",
    };
    dispatch({ type: "add_message", message, incrementUnread: false });

    if (current.mode === "demo") {
      window.setTimeout(() => {
        dispatch({ type: "patch_message", chatId, fromId: localId, patch: { status: "sent" } });
      }, 300);
      window.setTimeout(() => {
        dispatch({ type: "patch_message", chatId, fromId: localId, patch: { status: "delivered" } });
      }, 900);
      window.setTimeout(() => {
        dispatch({ type: "patch_message", chatId, fromId: localId, patch: { status: "read" } });
        dispatch({
          type: "add_message",
          incrementUnread: false,
          message: {
            id: `demo-in-${Date.now()}`,
            chatId,
            text: demoReply(value),
            timestamp: Date.now(),
            outgoing: false,
          },
        });
      }, 1600);
      return;
    }

    if (!current.credentials) {
      dispatch({ type: "patch_message", chatId, fromId: localId, patch: { status: "failed" } });
      return;
    }
    try {
      const idMessage = await sendMessage(current.credentials, chatId, value);
      dispatch({
        type: "patch_message",
        chatId,
        fromId: localId,
        patch: { id: idMessage, status: "sent" },
      });
    } catch (error) {
      dispatch({ type: "patch_message", chatId, fromId: localId, patch: { status: "failed" } });
      dispatch({
        type: "set_error",
        error: error instanceof Error ? error.message : "Не удалось отправить",
      });
    }
  }, []);

  const activeMessages = useMemo(() => {
    if (!state.activeChatId) {
      return [];
    }
    return state.messages[state.activeChatId] ?? [];
  }, [state.activeChatId, state.messages]);

  const activeChat = useMemo(
    () => state.chats.find((chat) => chat.id === state.activeChatId) ?? null,
    [state.chats, state.activeChatId],
  );

  return {
    ...state,
    activeChat,
    activeMessages,
    login,
    enterDemo,
    logout,
    openChat,
    createChat,
    send,
    dismissError,
  };
}

export type MessengerApi = ReturnType<typeof useMessenger>;
