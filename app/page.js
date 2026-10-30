"use client";

import { useState } from "react";
import "./globals.css";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

/* ---------- Smart-city scene with AI detection boxes (no image file needed) ---------- */
function Tag({ x, y, w, text, color }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="22" rx="6" fill={color} />
      <text
        x={x + 8}
        y={y + 15}
        fontSize="11"
        fontWeight="700"
        fill="#fff"
        fontFamily="inherit"
      >
        {text}
      </text>
    </g>
  );
}

function CityScene() {
  const towers = [
    [20, 120, 70, 210, "#BFD8E4"],
    [100, 70, 80, 260, "#A9C9D8"],
    [190, 140, 60, 190, "#C9DFE9"],
    [260, 90, 90, 240, "#B3D0DE"],
    [360, 130, 70, 200, "#C9DFE9"],
    [440, 60, 70, 270, "#A9C9D8"],
    [520, 110, 70, 220, "#BFD8E4"],
  ];
  return (
    <svg
      viewBox="0 0 600 470"
      className="scene"
      role="img"
      aria-label="Smart city street where AI detects a pothole, a broken streetlight and overflowing garbage"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3F3F8" />
          <stop offset="1" stopColor="#F7FBFA" />
        </linearGradient>
      </defs>
      <rect width="600" height="470" rx="28" fill="url(#sky)" />
      <circle cx="505" cy="62" r="26" fill="#FFE3A3" />

      {towers.map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="4" fill={c} />
          {Array.from({ length: Math.floor((h - 40) / 34) }).map((_, r) =>
            [0, 1].map((k) => (
              <rect
                key={r + "-" + k}
                x={x + 14 + k * (w / 2 - 6)}
                y={y + 16 + r * 34}
                width={w / 2 - 14}
                height="16"
                rx="3"
                fill={(i + r + k) % 4 === 0 ? "#FFD479" : "#EAF5F9"}
              />
            )),
          )}
        </g>
      ))}

      {/* trees */}
      <g fill="#7FC8A9">
        <circle cx="235" cy="300" r="22" />
        <circle cx="395" cy="304" r="18" />
      </g>
      <g fill="#6B8F7E">
        <rect x="233" y="310" width="4" height="22" />
        <rect x="393" y="311" width="4" height="22" />
      </g>

      {/* sidewalk + road */}
      <rect x="0" y="330" width="600" height="22" fill="#D7E0E3" />
      <rect x="0" y="352" width="600" height="118" fill="#3A4852" />
      <path
        d="M0 410H600"
        stroke="#F5F1E4"
        strokeWidth="4"
        strokeDasharray="34 24"
      />
      <path d="M0 462H600" stroke="#2C373F" strokeWidth="10" />

      {/* road damage cracks */}
      <path
        d="M470 392l22 10-8 12 24 8"
        stroke="#1E282F"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* streetlight (faulty) */}
      <rect x="118" y="186" width="6" height="146" fill="#4B5B66" />
      <path
        d="M121 190q0-22 28-22"
        stroke="#4B5B66"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="142" y="165" width="30" height="9" rx="4" fill="#4B5B66" />

      {/* garbage bin overflowing */}
      <g>
        <circle cx="436" cy="296" r="9" fill="#9BA9B0" />
        <circle cx="452" cy="290" r="11" fill="#C2CBCF" />
        <circle cx="468" cy="297" r="8" fill="#9BA9B0" />
        <rect x="428" y="300" width="56" height="8" rx="3" fill="#2E8F78" />
        <path d="M432 308h48l-4 24h-40z" fill="#3DA88F" />
      </g>

      {/* pothole */}
      <ellipse cx="290" cy="412" rx="36" ry="10" fill="#1E282F" />
      <ellipse cx="290" cy="410" rx="28" ry="6" fill="#2B373F" />

      {/* detection boxes */}
      <g className="det" style={{ animationDelay: ".3s" }}>
        <rect
          x="108"
          y="150"
          width="76"
          height="40"
          rx="8"
          fill="none"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <Tag x={108} y={126} w={118} text="Light off · 91%" color="#D98A0B" />
      </g>
      <g className="det" style={{ animationDelay: ".9s" }}>
        <rect
          x="418"
          y="268"
          width="76"
          height="70"
          rx="8"
          fill="none"
          stroke="#0F9D8A"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <Tag x={394} y={244} w={128} text="Garbage · High" color="#0B7F70" />
      </g>
      <g className="det" style={{ animationDelay: "1.5s" }}>
        <rect
          x="244"
          y="388"
          width="92"
          height="46"
          rx="8"
          fill="none"
          stroke="#E5533D"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <Tag x={244} y={364} w={112} text="Pothole · 94%" color="#C93F2A" />
      </g>
    </svg>
  );
}

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
        <path d="m9 12 2 2-2 2" />
      </svg>
    );
  if (type === "light")
    return (
      <svg {...p}>
        <path d="M12 21V9M8 21h8" />
        <path d="M12 9c0-3 2-5 6-5v3c0 1.5-1 2-2 2z" />
        <path d="M5 5 3.5 3.5M5 9H3" />
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
    text: "Snap the hole. AI measures how severe it is so dangerous ones get fixed first.",
  },
  {
    type: "road",
    tone: "blue",
    title: "Road damage",
    text: "Cracks, sunken patches and broken edges are flagged before they become potholes.",
  },
  {
    type: "light",
    tone: "amber",
    title: "Streetlights",
    text: "Dark or flickering lights get reported with the exact pole location.",
  },
  {
    type: "garbage",
    tone: "green",
    title: "Garbage",
    text: "Overflowing bins and dumped waste are spotted and sent to sanitation teams.",
  },
];

const steps = [
  {
    title: "Take a photo",
    text: "Open the app, snap the problem and your location is added automatically.",
  },
  {
    title: "AI sorts it",
    text: "The issue type and severity are detected, and duplicate reports are merged.",
  },
  {
    title: "Track it until fixed",
    text: "Follow the status from Reported to Resolved and see the after-photo.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <main className={`site ${display.variable} ${body.variable}`} id="home">
      <header className="navbar">
        <a href="#home" className="brand" onClick={close}>
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
        </a>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a className="active" href="#home" onClick={close}>
            Home
          </a>
          <a href="#issues" onClick={close}>
            Issues we detect
          </a>
          <Link href="/about" onClick={close}>
            About
          </Link>
          <a href="/about#how-it-works" onClick={close}>
            How it works
          </a>
          <Link href="/login" className="nav-cta" onClick={close}>
            Login / Signup
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="pill">
            <i /> Smart city reporting for everyone
          </p>
          <h1>Fix the whole street, not just the road.</h1>
          <p className="lead">
            Report potholes, road damage, broken streetlights and garbage with
            one photo. AI identifies the problem, finds the location and sends
            it to the right team.
          </p>
          <div className="actions">
            <Link href="/login#register" className="btn btn-primary">
              Report an issue
            </Link>
            <a href="/about#how-it-works" className="btn btn-ghost">
              See how it works
            </a>
          </div>
          <ul className="trust">
            <li>Photo + GPS in one tap</li>
            <li>Live status updates</li>
            <li>Works on any phone</li>
          </ul>
        </div>
        <div className="hero-art">
          <CityScene />
        </div>
      </section>

      <section className="section" id="issues">
        <div className="section-head">
          <h2>Four everyday problems, one place to report them</h2>
          <p>
            Each report is checked by AI so it reaches the right department
            faster.
          </p>
        </div>
        <div className="issue-grid">
          {issues.map((it) => (
            <article className="issue" key={it.type}>
              <div className={`issue-icon ${it.tone}`}>
                <Icon type={it.type} />
              </div>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section steps-wrap" id="how-it-works">
        <div className="section-head">
          <h2>From photo to fixed in three steps</h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-no">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cta">
        <div>
          <h2>Seen something broken on your street?</h2>
          <p>It takes less than a minute to report.</p>
        </div>
        <Link href="/login#register" className="btn btn-light">
          Get started
        </Link>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} NagarMitra AI</span>
        <span>Small reports. Meaningful change.</span>
      </footer>
    </main>
  );
}
