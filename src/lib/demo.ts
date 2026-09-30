import type { Chat, ChatMessage } from "../types";

const now = () => Date.now();

export function createDemoChats(): { chats: Chat[]; messages: Record<string, ChatMessage[]> } {
  const supportId = "demo-support";
  const friendId = "demo-79001234567";
  const t = now();
  const chats: Chat[] = [
    { id: supportId, title: "MAX Support", unread: 0 },
    { id: friendId, title: "+7 900 123-45-67", phone: "79001234567", unread: 1 },
  ];
  const messages: Record<string, ChatMessage[]> = {
    [supportId]: [
      {
        id: "d1",
        chatId: supportId,
        text: "Это демо-чат. Сообщения никуда не уходят.",
        timestamp: t - 120000,
        outgoing: false,
      },
      {
        id: "d2",
        chatId: supportId,
        text: "Для приёмки HR нужны idInstance и apiTokenInstance из GREEN-API.",
        timestamp: t - 60000,
        outgoing: true,
        status: "read",
      },
    ],
    [friendId]: [
      {
        id: "d3",
        chatId: friendId,
        text: "Напиши что-нибудь — отвечу автоматически.",
        timestamp: t - 30000,
        outgoing: false,
      },
    ],
  };
  return { chats, messages };
}

export function demoReply(text: string): string {
  const lower = text.trim().toLowerCase();
  if (lower.includes("привет") || lower.includes("здравств")) {
    return "Привет! Это автоответ демо-режима.";
  }
  return `Демо-ответ: «${text.slice(0, 120)}». В MAX этого сообщения нет.`;
}
