import type { Chat } from "../types";
import { formatListTime } from "../lib/format";

type Props = {
  chats: Chat[];
  messages: Record<string, { text: string; timestamp: number }[]>;
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onCreate: () => void;
};

export function ChatList({ chats, messages, activeChatId, onSelect, onCreate }: Props) {
  return (
    <div className="chat-list">
      <div className="chat-list-head">
        <span>Чаты</span>
        <button type="button" className="icon-btn" onClick={onCreate} title="Создать чат">
          +
        </button>
      </div>
      <div className="chat-list-body">
        {chats.length === 0 ? (
          <p className="empty-hint">Нет чатов. Нажмите +</p>
        ) : (
          chats.map((chat) => {
            const last = messages[chat.id]?.at(-1);
            return (
              <button
                key={chat.id}
                type="button"
                className={chat.id === activeChatId ? "chat-row active" : "chat-row"}
                onClick={() => onSelect(chat.id)}
              >
                <span className="avatar">{chat.title.slice(0, 1).toUpperCase()}</span>
                <span className="chat-row-main">
                  <span className="chat-row-top">
                    <span className="chat-row-title">{chat.title}</span>
                    {last ? <span className="chat-row-time">{formatListTime(last.timestamp)}</span> : null}
                  </span>
                  <span className="chat-row-bottom">
                    <span className="chat-row-preview">{last?.text ?? "Нет сообщений"}</span>
                    {chat.unread > 0 ? <span className="badge">{chat.unread}</span> : null}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
