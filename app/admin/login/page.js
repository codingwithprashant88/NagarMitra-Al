"use client";

import { useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { useRouter } from "next/navigation";


const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

const DEPARTMENTS = [
  "Roads & Potholes",
  "Street Lighting",
  "Sanitation & Garbage",
  "Super Admin",
];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function AdminLogin() {
  const [f, setF] = useState({
    id: "",
    password: "",
    dept: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const router = useRouter();

  const locked = fails >= 5;
  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

 async function submit(e) {
  e.preventDefault();

  if (locked || busy) return;

  const identifier = f.id.trim();
  const er = {};

  if (!identifier || (!emailOk(identifier) && identifier.length < 4)) {
    er.id = "Enter your official email or employee ID.";
  }

  if (!f.password || f.password.length < 8) {
    er.password = "Password must be at least 8 characters.";
  }

  setErrors(er);
  setMsg({ type: "", text: "" });

  if (Object.keys(er).length > 0) return;

  setBusy(true);

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        identifier,
        password: f.password,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setFails((n) => n + 1);

      setMsg({
        type: "err",
        text:
          data.message === "Server configuration error."
            ? "Login is temporarily unavailable. Please contact your administrator."
            : "Sign-in failed. Check your details and try again.",
      });

      return;
    }

    setFails(0);

    setMsg({
      type: "ok",
      text: "Login successful. Redirecting...",
    });

    router.replace("/admin/dashboard");
    router.refresh();
  } catch (error) {
    setMsg({
      type: "err",
      text: "Unable to connect to the server. Please try again.",
    });
  } finally {
    setBusy(false);
  }
}
  return (
    <div className={`ad-site ${display.variable} ${body.variable}`}>
      <header className="ad-top">
        <Link href="/" className="ad-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
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
          <span className="ad-tag">Admin</span>
        </Link>
      </header>

      <main className="ad-main">
        <section className="ad-intro">
          <h1>City team console</h1>
          <p>
            Review incoming reports, assign them to field teams and close them
            once the work is done.
          </p>
          <ul className="ad-list">
            <li>
              <span className="ad-dot a" /> Reports sorted by type and severity
            </li>
            <li>
              <span className="ad-dot g" /> Assign work by ward and department
            </li>
            <li>
              <span className="ad-dot b" /> Update status and add after-photos
            </li>
          </ul>
        </section>

        <section className="ad-card" aria-labelledby="ad-title">
          <div className="ad-lock" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="11" width="14" height="9" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h2 id="ad-title">Admin sign in</h2>
          <p className="ad-sub">For authorised municipal staff only.</p>

          <form className="ad-form" onSubmit={submit} noValidate>
            <div className="ad-field">
              <label htmlFor="ad-id">Official email or employee ID</label>
              <div className="ad-input">
                <input
                  id="ad-id"
                  value={f.id}
                  onChange={set("id")}
                  autoComplete="username"
                  placeholder="name@city.gov.in"
                  aria-invalid={!!errors.id}
                  aria-describedby={errors.id ? "ad-id-err" : undefined}
                />
              </div>
              {errors.id && (
                <span className="ad-err" id="ad-id-err" role="alert">
                  {errors.id}
                </span>
              )}
            </div>

            <div className="ad-field">
              <label htmlFor="ad-pass">Password</label>
              <div className="ad-input has-btn">
                <input
                  id="ad-pass"
                  type={show ? "text" : "password"}
                  value={f.password}
                  onChange={set("password")}
                  onKeyUp={(e) =>
                    setCaps(
                      e.getModifierState && e.getModifierState("CapsLock"),
                    )
                  }
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "ad-pass-err" : undefined}
                />
                <button
                  type="button"
                  className="ad-eye"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              {caps && <span className="ad-warn">Caps Lock is on.</span>}
              {errors.password && (
                <span className="ad-err" id="ad-pass-err" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="ad-between">
              <label className="ad-check">
                <input
                  type="checkbox"
                  checked={f.remember}
                  onChange={set("remember")}
                />{" "}
                Trust this device
              </label>
            </div>

            {locked && (
              <p className="ad-alert" role="alert">
                Too many failed attempts. Please wait a few minutes or contact
                your system administrator.
              </p>
            )}
            {msg.text && (
              <p
                className={msg.type === "ok" ? "ad-ok" : "ad-alert"}
                role="status"
              >
                {msg.text}
              </p>
            )}

            <button className="ad-submit" disabled={busy || locked}>
              {busy ? "Signing in…" : <span className="text-white font-bold">Sign in</span>}
            </button>
          </form>

          <p className="ad-note">
            Admin accounts are created by your system administrator. There is no
            public sign-up.
          </p>
        </section>
      </main>
    </div>
  );
}
