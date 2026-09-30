import { useState, type FormEvent } from "react";
import type { Credentials } from "../types";

type Props = {
  connecting: boolean;
  error: string | null;
  onLogin: (credentials: Credentials) => void;
  onDemo: () => void;
};

export function LoginScreen({ connecting, error, onLogin, onDemo }: Props) {
  const [apiUrl, setApiUrl] = useState("");
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onLogin({ apiUrl, idInstance, apiTokenInstance });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <span className="logo" aria-hidden />
          <h1>MAX</h1>
        </div>
        <p className="login-lead">Введите данные инстанса GREEN-API</p>
        <form className="login-form" onSubmit={submit}>
          <label>
            apiUrl
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="https://3100.api.green-api.com"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            idInstance
            <input
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            apiTokenInstance
            <input
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              type="password"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={connecting}>
            {connecting ? "Подключение…" : "Войти"}
          </button>
        </form>
        <button className="btn-ghost" type="button" onClick={onDemo} disabled={connecting}>
          Демо без инстанса
        </button>
        <p className="login-hint">
          apiUrl — из кабинета (не общий api.green-api.com). Демо только для UI, не для HR.
        </p>
      </div>
    </div>
  );
}
