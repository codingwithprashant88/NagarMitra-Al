"use client";

import { useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "../globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

/* ---------------- Data ---------------- */
function Icon({ type }) {
  const p = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (type === "pothole")
    return (
      <svg {...p}>
        <ellipse cx="12" cy="15" rx="8" ry="3.5" />
        <path d="M4 9h4M16 9h4M12 5v4" />
      </svg>
    );
  if (type === "road")
    return (
      <svg {...p}>
        <path d="M7 3 4 21M17 3l3 18M12 4v3M12 10v4M12 17v3" />
      </svg>
    );
  if (type === "light")
    return (
      <svg {...p}>
        <path d="M12 21V9M8 21h8" />
        <path d="M12 9c0-3 2-5 6-5v3c0 1.5-1 2-2 2z" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M6 8h12l-1.2 12H7.2z" />
      <path d="M4 8h16M9 8V5h6v3" />
      <path d="M10 12v5M14 12v5" />
    </svg>
  );
}

const issues = [
  {
    type: "pothole",
    tone: "coral",
    title: "Potholes",
    text: "Holes in the road that cause accidents and vehicle damage.",
  },
  {
    type: "road",
    tone: "blue",
    title: "Road damage",
    text: "Cracks, sunken patches and broken road edges.",
  },
  {
    type: "light",
    tone: "amber",
    title: "Streetlights",
    text: "Lights that are off, flickering or damaged.",
  },
  {
    type: "garbage",
    tone: "green",
    title: "Garbage",
    text: "Overflowing bins and waste dumped in public places.",
  },
];

const steps = [
  {
    title: "Report",
    text: "Take a photo. Your GPS location is added automatically.",
  },
  {
    title: "Detect",
    text: "AI identifies the issue type and how severe it is.",
  },
  {
    title: "Assign",
    text: "Duplicates are merged and the report goes to the right department.",
  },
  {
    title: "Resolve",
    text: "Track progress and see an after-photo when it is fixed.",
  },
];

/* ---------------- Page ---------------- */
export default function About() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <main className={`ab-site ${display.variable} ${body.variable}`}>
      <header className="ab-nav">
        <Link href="/" className="ab-brand" onClick={close}>
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

        <button
          className="ab-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={open ? "ab-links open" : "ab-links"}>
          <Link href="/" onClick={close}>
            Home
          </Link>
          <Link href="/about" className="active" onClick={close}>
            About
          </Link>
          <a href="#how-it-works" onClick={close}>
            How it works
          </a>
          <Link href="/login" className="ab-cta" onClick={close}>
            Login / Signup
          </Link>
        </nav>
      </header>

      <section className="ab-hero">
        <div className="ab-wrap">
          <p className="ab-pill">
            <i /> About NagarMitra AI
          </p>
          <h1>Making city problems easy to report and hard to ignore.</h1>
          <p className="ab-lead">
            CivicFix AI connects citizens with city teams. Anyone can report a
            pothole, damaged road, broken streetlight or pile of garbage with a
            photo, and AI helps the right people fix it faster.
          </p>
          <div className="ab-stats">
            <div className="ab-stat">
              <strong>One photo</strong>
              <span>is all it takes to report</span>
            </div>
            <div className="ab-stat">
              <strong>Four issue types</strong>
              <span>detected automatically</span>
            </div>
            <div className="ab-stat">
              <strong>Live tracking</strong>
              <span>from reported to resolved</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ab-sec">
        <div className="ab-wrap">
          <div className="ab-head">
            <h2>What we help fix</h2>
            <p>
              A city is more than its roads. These are the everyday problems
              residents see most.
            </p>
          </div>
          <div className="ab-issues">
            {issues.map((it) => (
              <article className="ab-card" key={it.type}>
                <div className={`ab-ico ${it.tone}`}>
                  <Icon type={it.type} />
                </div>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ab-sec ab-band" id="how-it-works">
        <div className="ab-wrap">
          <div className="ab-head">
            <h2>How it works</h2>
            <p>
              Four simple steps from the problem on your street to a fixed one.
            </p>
          </div>
          <ol className="ab-steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="ab-no">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ab-sec">
        <div className="ab-wrap ab-split">
          <div className="ab-panel light">
            <h3>For citizens</h3>
            <ul>
              <li>Report in under a minute from any phone</li>
              <li>Get status updates until the issue is closed</li>
              <li>See what has been fixed in your area</li>
            </ul>
          </div>
          <div className="ab-panel dark">
            <h3>For city teams</h3>
            <ul>
              <li>Reports arrive sorted by type and severity</li>
              <li>Duplicate complaints are merged automatically</li>
              <li>Ward-wise dashboard to assign and close work</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="ab-wrap">
          <div className="ab-final">
            <div>
              <h2>Ready to fix your street?</h2>
              <p>Create a free account and send your first report.</p>
            </div>
            <Link href="/login#register" className="ab-btn">
              <span className="text-white">Get started</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="ab-foot">
        <span>© {new Date().getFullYear()} NagarMitra AI</span>
        <span>Small reports. Meaningful change.</span>
      </footer>
    </main>
  );
}
