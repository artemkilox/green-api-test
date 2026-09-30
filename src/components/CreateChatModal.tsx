import { useState, type FormEvent } from "react";

type Props = {
  onClose: () => void;
  onCreate: (phone: string) => Promise<void>;
};

export function CreateChatModal({ onClose, onCreate }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onCreate(phone);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать чат");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <h2>Новый чат</h2>
        <p>Номер получателя в MAX</p>
        <form onSubmit={submit}>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+7 900 123-45-67"
            autoFocus
          />
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Проверка…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
