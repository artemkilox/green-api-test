import { useEffect, useRef } from "react";
import type { ChatMessage, MessageStatus } from "../types";
import { formatClock } from "../lib/format";

type Props = {
  messages: ChatMessage[];
};

function Ticks({ status }: { status?: MessageStatus }) {
  if (!status || status === "pending") {
    return <span className="ticks pending">·</span>;
  }
  if (status === "failed") {
    return <span className="ticks failed">!</span>;
  }
  if (status === "sent") {
    return (
      <span className="ticks">
        <i>✓</i>
      </span>
    );
  }
  return (
    <span className={status === "read" ? "ticks read" : "ticks"}>
      <i>✓</i>
      <i>✓</i>
    </span>
  );
}

export function MessagePane({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return <div className="messages empty-pane">Напишите первое сообщение</div>;
  }
  return (
    <div className="messages">
      {messages.map((message) => (
        <div key={message.id} className={message.outgoing ? "bubble-wrap out" : "bubble-wrap in"}>
          <div className="bubble">
            <p>{message.text}</p>
            <span className="meta">
              {formatClock(message.timestamp)}
              {message.outgoing ? <Ticks status={message.status} /> : null}
            </span>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
