import { useState, type FormEvent } from "react";

type Props = {
  disabled: boolean;
  onSend: (text: string) => void;
};

export function Composer({ disabled, onSend }: Props) {
  const [text, setText] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }
    onSend(value);
    setText("");
  };

  return (
    <form className="composer" onSubmit={submit}>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Сообщение"
        disabled={disabled}
        maxLength={4000}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        ➤
      </button>
    </form>
  );
}
