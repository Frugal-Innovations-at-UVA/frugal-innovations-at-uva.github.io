"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form className="queue-form" action={formAction}>
      <div className="queue-field">
        <label htmlFor="password">Dashboard password</label>
        <input
          className="queue-input"
          id="password"
          name="password"
          type="password"
          required
          autoFocus
        />
      </div>

      {state?.error && <p className="queue-error">{state.error}</p>}

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Checking..." : "Log In"}
      </button>
    </form>
  );
}
