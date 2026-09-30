import { useState } from "react";
import type { MessengerApi } from "../lib/useMessenger";
import { ChatList } from "./ChatList";
import { Composer } from "./Composer";
import { CreateChatModal } from "./CreateChatModal";
import { MessagePane } from "./MessagePane";

type Props = {
  messenger: MessengerApi;
};

export function ChatLayout({ messenger }: Props) {
  const [creating, setCreating] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(messenger.activeChatId));

  const selectChat = (chatId: string) => {
    messenger.openChat(chatId);
    setMobileChatOpen(true);
  };

  return (
    <div className={messenger.mode === "demo" ? "shell demo" : "shell"}>
      {messenger.mode === "demo" ? (
        <div className="demo-banner">Демо-режим: сообщения не уходят в MAX</div>
      ) : null}
      <aside className={mobileChatOpen ? "sidebar hide-mobile" : "sidebar"}>
        <header className="sidebar-head">
          <span className="logo small" />
          <strong>MAX</strong>
          <button type="button" className="btn-ghost tiny" onClick={messenger.logout}>
            Выйти
          </button>
        </header>
        <ChatList
          chats={messenger.chats}
          messages={messenger.messages}
          activeChatId={messenger.activeChatId}
          onSelect={selectChat}
          onCreate={() => setCreating(true)}
        />
      </aside>
      <section className={mobileChatOpen ? "thread" : "thread hide-mobile"}>
        {messenger.activeChat ? (
          <>
            <header className="thread-head">
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setMobileChatOpen(false);
                  messenger.openChat(null);
                }}
              >
                ←
              </button>
              <span className="avatar sm">{messenger.activeChat.title.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{messenger.activeChat.title}</strong>
                {messenger.activeChat.phone ? <span className="sub">{messenger.activeChat.phone}</span> : null}
              </div>
            </header>
            <MessagePane messages={messenger.activeMessages} />
            <Composer disabled={false} onSend={messenger.send} />
          </>
        ) : (
          <div className="empty-pane center">Выберите чат или создайте новый</div>
        )}
      </section>
      {messenger.error ? (
        <button type="button" className="toast" onClick={messenger.dismissError}>
          {messenger.error}
        </button>
      ) : null}
      {creating ? (
        <CreateChatModal
          onClose={() => setCreating(false)}
          onCreate={async (phone) => {
            await messenger.createChat(phone);
            setMobileChatOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}
