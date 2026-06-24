import React, { useState } from "react";
import { Field, TextInput } from "../components/ui.jsx";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await onLogin(email, password);
    if (!result.ok) setError(result.message);
    setSubmitting(false);
  };

  return (
    <main className="login-screen">
      <form className="login-panel" onSubmit={submit}>
        <div className="login-brand">
          <img src="/epi-logo.png" alt="EPI Indonesia Bullion Ecosystem" />
          <h1>Event Manager</h1>
          <p>Masuk untuk mengakses dashboard, evaluasi, dan report event.</p>
        </div>
        {error && <div className="alert error">{error}</div>}
        <Field label="Email">
          <TextInput
            value={email}
            onChange={(inputEvent) => setEmail(inputEvent.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            type="email"
            autoComplete="username"
          />
        </Field>
        <Field label="Password">
          <TextInput
            value={password}
            onChange={(inputEvent) => setPassword(inputEvent.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            type="password"
            autoComplete="current-password"
          />
        </Field>
        <button className={`button primary login-submit ${focused ? "is-active" : ""} ${submitting ? "is-loading" : ""}`} type="submit" disabled={submitting}>
          <span className="login-lock" aria-hidden="true">
            <span className="lock-shackle"></span>
            <span className="lock-body">
              <span className="lock-keyhole"></span>
            </span>
          </span>
          <span>{submitting ? "MEMERIKSA..." : "AKSES DASHBOARD"}</span>
        </button>
      </form>
      <footer className="login-credit">
        Made with love ♥ by <a href="https://arvadigital.web.id/" target="_blank" rel="noreferrer">Arva Digital Media</a>
      </footer>
    </main>
  );
}
