"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { useRouter } from "next/navigation";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

/* ---------------- Helpers ---------------- */
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ""));

function Field({ id, label, error, children }) {
  return (
    <div className="lg-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span className="lg-err" id={`${id}-err`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="lg-input has-btn">
      <input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <button
        type="button"
        className="lg-eye"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/* ---------------- Login form ---------------- */
function LoginForm({ goRegister }) {
  const [f, setF] = useState({ id: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (e) => {
    const { type, checked, value } = e.target;

    setF((prev) => ({
      ...prev,
      [k]: type === "checkbox" ? checked : value,
    }));
  };

  async function submit(e) {
    e.preventDefault();

    const er = {};

    if (!emailOk(f.id.trim()) && !phoneOk(f.id)) {
      er.id = "Enter a valid email or 10-digit mobile number.";
    }

    if (f.password.length < 6) {
      er.password = "Password must be at least 6 characters.";
    }

    setErrors(er);
    setMsg("");

    if (Object.keys(er).length) return;

    setBusy(true);

    try {
      const isEmail = emailOk(f.id.trim());

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? f.id.trim().toLowerCase() : f.id.replace(/\s/g, ""),
          password: f.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login failed. Please try again.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setMsg("Unable to connect. Please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="lg-form" onSubmit={submit} noValidate>
      <Field id="login-id" label="Email or mobile number" error={errors.id}>
        <div className="lg-input">
          <input
            id="login-id"
            name="login-id"
            value={f.id}
            onChange={set("id")}
            autoComplete="username"
            placeholder="you@example.com"
            aria-invalid={!!errors.id}
            aria-describedby={errors.id ? "login-id-err" : undefined}
          />
        </div>
      </Field>
      <Field id="login-password" label="Password" error={errors.password}>
        <PasswordInput
          id="login-password"
          value={f.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="current-password"
        />
      </Field>
      <div className="lg-between">
        <label className="lg-check" style={{ alignItems: "center" }}>
          <input
            type="checkbox"
            checked={f.remember}
            onChange={set("remember")}
          />{" "}
          Keep me signed in
        </label>
      </div>
      {msg && (
        <p className="lg-msg" role="status">
          {msg}
        </p>
      )}
      <button className="lg-submit" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      <p className="lg-switch">
        New to NagarMitra AI?{" "}
        <button type="button" className="lg-link" onClick={goRegister}>
          Create an account
        </button>
      </p>
    </form>
  );
}

/* ---------------- Registration form ---------------- */

function RegisterForm({ goLogin }) {
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    password: "",
    confirm: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const route = useRouter();
  const set = (key) => (e) => {
    const { type, checked, value } = e.target;

    setF((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
    }));
  };

  async function submit(e) {
    e.preventDefault();

    const er = {};

    if (f.name.trim().length < 2) {
      er.name = "Enter your full name.";
    }

    if (!emailOk(f.email)) {
      er.email = "Enter a valid email address.";
    }

    if (!phoneOk(f.phone)) {
      er.phone = "Enter a valid 10-digit mobile number.";
    }

    if (f.password.length < 8) {
      er.password = "Use at least 8 characters.";
    }

    if (f.confirm !== f.password) {
      er.confirm = "Passwords do not match.";
    }

    if (!f.terms) {
      er.terms = "Please accept the terms to continue.";
    }

    setErrors(er);
    setMsg("");

    if (Object.keys(er).length > 0) return;

    setBusy(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: f.name.trim(),
          email: f.email.trim().toLowerCase(),
          phone: f.phone.replace(/\s/g, ""),
          password: f.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Unable to create account.");
        return;
      }

      route.push("/dashboard");
    } catch (error) {
      setMsg("Unable to connect. Please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = (id, key, label, props = {}) => (
    <Field id={id} label={label} error={errors[key]}>
      <div className="lg-input">
        <input
          id={id}
          name={id}
          value={f[key]}
          onChange={set(key)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${id}-err` : undefined}
          {...props}
        />
      </div>
    </Field>
  );

  return (
    <form className="lg-form" onSubmit={submit} noValidate>
      {input("reg-name", "name", "Full name", {
        autoComplete: "name",
        placeholder: "Your name",
      })}
      <div className="lg-row">
        {input("reg-email", "email", "Email", {
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        })}
        {input("reg-phone", "phone", "Mobile number", {
          type: "tel",
          inputMode: "numeric",
          autoComplete: "tel",
          placeholder: "10-digit number",
        })}
      </div>
      <div className="lg-row">
        <Field id="reg-password" label="Password" error={errors.password}>
          <PasswordInput
            id="reg-password"
            value={f.password}
            onChange={set("password")}
            error={errors.password}
            autoComplete="new-password"
          />
        </Field>
        <Field id="reg-confirm" label="Confirm password" error={errors.confirm}>
          <PasswordInput
            id="reg-confirm"
            value={f.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <div className="lg-field">
        <label className="lg-check">
          <input type="checkbox" checked={f.terms} onChange={set("terms")} />
          <span>I agree to the Terms of Use and Privacy Policy.</span>
        </label>
        {errors.terms && (
          <span className="lg-err" role="alert">
            {errors.terms}
          </span>
        )}
      </div>
      {msg && (
        <p className="lg-msg" role="status">
          {msg}
        </p>
      )}
      <button className="lg-submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="lg-switch">
        Already have an account?{" "}
        <button type="button" className="lg-link" onClick={goLogin}>
          Log in
        </button>
      </p>
    </form>
  );
}

/* ---------------- Page ---------------- */
export default function LoginPage() {
  const [mode, setMode] = useState("login");

  // open the Register tab when the URL is /login#register
  useEffect(() => {
    const sync = () =>
      setMode(window.location.hash === "#register" ? "register" : "login");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function switchTo(m) {
    setMode(m);
    window.history.replaceState(
      null,
      "",
      m === "register" ? "#register" : window.location.pathname,
    );
  }

  return (
    <div className={`lg-site ${display.variable} ${body.variable}`}>
      <header className="lg-top">
        <Link href="/" className="lg-brand">
          <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="#0F9D8A" />
            <path
              d="M16 6c-4.4 0-8 3.4-8 7.6 0 5.2 8 12.4 8 12.4s8-7.2 8-12.4C24 9.4 20.4 6 16 6z"
              fill="#fff"
            />
            <path
              d="m12.5 13.5 2.5 2.5 4.5-4.5"
              stroke="#0F9D8A"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            NagarMitra <b>AI</b>
          </span>
        </Link>
        <Link href="/" className="lg-back">
          Back to home
        </Link>
      </header>

      <main className="lg-main">
        <aside className="lg-side">
          <h1>Your street, your voice.</h1>
          <p>
            Join your neighbours in reporting and tracking problems across the
            city.
          </p>
          <ul className="lg-list">
            <li>
              <span className="lg-dot c" /> Potholes and road damage
            </li>
            <li>
              <span className="lg-dot a" /> Broken or dark streetlights
            </li>
            <li>
              <span className="lg-dot g" /> Garbage and overflowing bins
            </li>
            <li>
              <span className="lg-dot b" /> Live status until it is fixed
            </li>
          </ul>
        </aside>

        <section className="lg-card" id="register-card">
          <div className="lg-tabs" role="tablist" aria-label="Account">
            <button
              role="tab"
              className="lg-tab"
              aria-selected={mode === "login"}
              onClick={() => switchTo("login")}
            >
              Log in
            </button>
            <button
              role="tab"
              className="lg-tab"
              aria-selected={mode === "register"}
              onClick={() => switchTo("register")}
            >
              Sign up
            </button>
          </div>

          {mode === "login" ? (
            <>
              <h2>Welcome back</h2>
              <p className="lg-sub">
                Log in to report issues and track your complaints.
              </p>
              <LoginForm goRegister={() => switchTo("register")} />
            </>
          ) : (
            <>
              <h2>Create your account</h2>
              <p className="lg-sub">It takes less than a minute.</p>
              <RegisterForm goLogin={() => switchTo("login")} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
