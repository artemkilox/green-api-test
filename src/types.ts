export type Credentials = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type ChatMessage = {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  outgoing: boolean;
  status?: MessageStatus;
};

export type Chat = {
  id: string;
  title: string;
  phone?: string;
  unread: number;
};

export type SessionMode = "live" | "demo";
