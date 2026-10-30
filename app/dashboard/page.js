"use client";

import { cache, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { useRouter } from "next/navigation";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

/* ---------------- Data ---------------- */
// TODO: replace with data from your API / database for the logged-in user.
const USER = { name: "Rahul Sharma" };
const TYPES = {
  pothole: { label: "Pothole", mark: "P" },
  road: { label: "Road damage", mark: "R" },
  light: { label: "Streetlight", mark: "L" },
  garbage: { label: "Garbage", mark: "G" },
};
const STAGES = ["Reported", "Assigned", "Progress", "Resolved"];
const STAGE_LABEL = {
  Reported: "Reported",
  Assigned: "Assigned",
  Progress: "In progress",
  Resolved: "Resolved",
};

const seed = [
  {
    id: "CF-1042",
    type: "pothole",
    title: "Deep pothole near Bus Stand",
    place: "Station Road, Ward 12",
    date: "2 days ago",
    severity: "High",
    status: "Progress",
  },
  {
    id: "CF-1038",
    type: "light",
    title: "Streetlight not working",
    place: "Gandhi Chowk, Ward 5",
    date: "4 days ago",
    severity: "Medium",
    status: "Assigned",
  },
  {
    id: "CF-1031",
    type: "garbage",
    title: "Overflowing bin outside market",
    place: "Sabzi Mandi, Ward 8",
    date: "1 week ago",
    severity: "Medium",
    status: "Resolved",
  },
  {
    id: "CF-1027",
    type: "road",
    title: "Cracked road edge",
    place: "College Road, Ward 3",
    date: "2 weeks ago",
    severity: "Low",
    status: "Resolved",
  },
];

const FILTERS = ["All", "Reported", "Assigned", "Progress", "Resolved"];

/* ---------------- Report modal ---------------- */
function ReportModal({ onClose, onSubmit }) {
  const [f, setF] = useState({ type: "", place: "", note: "" });
  const [photo, setPhoto] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [errors, setErrors] = useState({});
  const [locBusy, setLocBusy] = useState(false);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysis(null);
    setAiError("");
    setErrors((prev) => ({ ...prev, photo: "" }));

    if (!file.type.startsWith("image/")) {
      setAiError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAiError("Image must be 5 MB or smaller.");
      return;
    }

    setPhoto({
      file,
      url: URL.createObjectURL(file),
    });

    setAiBusy(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/ai/analyze-issue", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "AI analysis failed.");
      }

      // API may return the result directly or inside data.analysis.
      const result = data.analysis ?? data;

      if (
        !result ||
        typeof result.description !== "string" ||
        typeof result.issueType !== "string"
      ) {
        throw new Error(
          "AI returned an invalid analysis. Please try another image.",
        );
      }

      setAnalysis(result);

      // Auto-fill the issue description.
      if (result.description) {
        setF((prev) => ({
          ...prev,
          note: prev.note || result.description,
        }));
      }

      // Auto-fill the issue type when supported.
      if (TYPES[result.issueType]) {
        setF((prev) => ({
          ...prev,
          type: result.issueType,
        }));
      }
    } catch (error) {
      console.error("AI image analysis error:", error);
      setAiError(error.message || "Unable to analyze this image.");
    } finally {
      setAiBusy(false);
    }
  }

  function useGps() {
    if (!navigator.geolocation)
      return setErrors({
        ...errors,
        place: "GPS is not available on this device.",
      });
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((s) => ({
          ...s,
          place: `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`,
        }));
        setLocBusy(false);
      },
      () => {
        setErrors((e) => ({
          ...e,
          place: "Could not get your location. Type it instead.",
        }));
        setLocBusy(false);
      },
    );
  }

  function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.type) er.type = "Choose the type of issue.";
    if (f.place.trim().length < 3) er.place = "Add the location.";
    if (!photo) er.photo = "Add a photo of the issue.";
    if (aiBusy) {
      setAiError("Please wait until AI finishes analyzing the image.");
      return;
    }
    setErrors(er);
    if (Object.keys(er).length) return;

    onSubmit({
      ...f,
      photo: photo.file,
      aiAnalysis: analysis,
    });
  }

  return (
    <div
      className="db-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="db-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rep-title"
      >
        <div className="db-mhead">
          <h2 id="rep-title">Report an issue</h2>
          <button className="db-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="db-form" onSubmit={submit} noValidate>
          <div className="db-field">
            <label>Photo of the issue</label>

            <div className="grid grid-cols-2 gap-3">
              {/* Gallery option */}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-teal-500 hover:bg-teal-50"
              >
                <span className="text-3xl">🖼️</span>
                <strong className="text-sm text-slate-800">Gallery</strong>
                <span className="text-xs text-slate-500">
                  Choose existing photo
                </span>
              </button>

              {/* Camera option */}
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-teal-500 hover:bg-teal-50"
              >
                <span className="text-3xl">📷</span>
                <strong className="text-sm text-slate-800">Camera</strong>
                <span className="text-xs text-slate-500">
                  Take a new picture
                </span>
              </button>

              {/* Gallery input */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e);
                  e.target.value = "";
                }}
              />

              {/* Camera input */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Selected image preview */}
            {photo && (
              <div className="mt-3">
                <img
                  src={photo.url}
                  alt="Selected issue"
                  className="h-48 w-full rounded-xl object-cover"
                />

                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(photo.url);
                    setPhoto(null);
                    setAnalysis(null);
                    setAiError("");
                    setErrors((prev) => ({ ...prev, photo: "" }));
                  }}
                  className="mt-2 text-sm font-medium text-red-600"
                >
                  Remove photo
                </button>
              </div>
            )}

            {errors.photo && (
              <span className="db-err" role="alert">
                {errors.photo}
              </span>
            )}

            {aiBusy && (
              <p className="db-meta mt-2" role="status">
                AI is analyzing your image...
              </p>
            )}

            {aiError && (
              <span className="db-err" role="alert">
                {aiError}
              </span>
            )}

            {analysis && (
              <div className="db-badges mt-2" aria-live="polite">
                <span className="db-badge Pending">AI: {analysis.label}</span>

                <span className={`db-badge ${analysis.severity}`}>
                  {analysis.severity} severity
                </span>

                <p className="db-meta">{analysis.description}</p>
              </div>
            )}
          </div>

          <div className="db-field">
            <label htmlFor="rep-type">Issue type</label>
            <select
              id="rep-type"
              value={f.type}
              onChange={(e) => setF({ ...f, type: e.target.value })}
            >
              <option value="">Select type</option>
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <span className="db-err" role="alert">
                {errors.type}
              </span>
            )}
          </div>

          <div className="db-field">
            <label htmlFor="rep-place">Location</label>
            <div className="db-loc">
              <input
                id="rep-place"
                type="text"
                value={f.place}
                onChange={(e) => setF({ ...f, place: e.target.value })}
                placeholder="Street, landmark or ward"
              />
              <button
                type="button"
                className="db-btn ghost"
                onClick={useGps}
                disabled={locBusy}
              >
                {locBusy ? "Locating…" : "Use my location"}
              </button>
            </div>
            {errors.place && (
              <span className="db-err" role="alert">
                {errors.place}
              </span>
            )}
          </div>
          {/* Manual Location */}
          <div className="db-field">
            <label htmlFor="rep-manual-place">
              Enter location manually (Optional)
            </label>
            <input
              id="rep-manual-place"
              type="text"
              value={f.place}
              onChange={(e) => setF({ ...f, place: e.target.value })}
              placeholder="Enter area, street, landmark or ward"
            />
          </div>

          <div className="db-field">
            <label htmlFor="rep-note">Details (optional)</label>
            <textarea
              id="rep-note"
              value={f.note}
              onChange={(e) => setF({ ...f, note: e.target.value })}
              placeholder="Anything that helps the team find or fix it"
            />
          </div>

          <button className="db-btn">Submit report</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [logout, setLogout] = useState();

  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [dashboardRes, reportsRes] = await Promise.all([
          fetch("/api/citizen/dashboard"),
          fetch("/api/reports"),
        ]);

        const dashboardData = await dashboardRes.json();
        const reportsData = await reportsRes.json();

        if (!dashboardRes.ok || !reportsRes.ok) {
          throw new Error(
            dashboardData.message ||
              reportsData.message ||
              "Failed to load dashboard",
          );
        }

        if (!active) return;

        setUser(dashboardData.user);

        setItems(
          reportsData.reports.map((r) => ({
            ...r,
            date: new Date(r.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })),
        );
      } catch (error) {
        if (active) {
          setToast(error.message || "Could not load reports.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const count = (s) => items.filter((i) => i.status === s).length;
  const shown = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "All" || i.status === filter) &&
          (i.title + i.place + i.id).toLowerCase().includes(q.toLowerCase()),
      ),
    [items, filter, q],
  );

  async function addReport(r) {
    try {
      const formData = new FormData();

      formData.append("type", r.type);
      formData.append("place", r.place);
      formData.append("note", r.note || "");
      formData.append("photo", r.photo);

      if (r.aiAnalysis) {
        formData.append("aiAnalysis", JSON.stringify(r.aiAnalysis));
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit report.");
      }

      const saved = data.report;

      setItems((previous) => [
        {
          ...saved,
          date: new Date(saved.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
        ...previous,
      ]);

      setOpen(false);
      setToast("Report submitted. You can track it here.");
    } catch (error) {
      setToast(error.message || "Could not submit report.");
    }
  }

  useEffect(() => {
    const citizenAuth = async () => {
      try {
        const response = await fetch("/api/citizen/dashboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Authentication error:", error);
        router.replace("/login");
      }
    };

    citizenAuth();
  }, [router]);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  async function clearLogout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      const logoutdata = await response.json();

      if (!response.ok || logoutdata.success === false) {
        throw new Error(data.message || "AI analysis failed.");
      }

      setLogout(logoutdata);
    } catch (error) {
      throw Error("Logout field");
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying citizen session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className={`db-site ${display.variable} ${body.variable}`}>
      <header className="db-top">
        <Link href="/" className="db-brand">
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
        </Link>
        <div className="db-user">
          <span className="db-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="db-uname">{user.name}</span>

          <Link onClick={clearLogout} href="/login" className="db-logout">
            Log out
          </Link>
        </div>
      </header>

      <main className="db-wrap">
        <div className="db-hello">
          <div>
            <h1>Hello, {user.name.split(" ")[0]}</h1>
            <p>Here is what is happening with your reports.</p>
          </div>
          <button className="db-btn" onClick={() => setOpen(true)}>
            + Report an issue
          </button>
        </div>

        <section className="db-stats" aria-label="Summary">
          <div className="db-stat">
            <span>Total reports</span>
            <strong>{items.length}</strong>
          </div>
          <div className="db-stat">
            <span>
              <i style={{ background: "#8aa0ab" }} />
              Waiting
            </span>
            <strong>{count("Reported") + count("Assigned")}</strong>
          </div>
          <div className="db-stat">
            <span>
              <i style={{ background: "var(--amber)" }} />
              In progress
            </span>
            <strong>{count("Progress")}</strong>
          </div>
          <div className="db-stat">
            <span>
              <i style={{ background: "var(--teal)" }} />
              Resolved
            </span>
            <strong>{count("Resolved")}</strong>
          </div>
        </section>

        <section className="db-panel" aria-labelledby="my-reports">
          <div className="db-bar">
            <h2 id="my-reports">My reports</h2>
            <div className="db-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className="db-chip"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f === "All" ? "All" : STAGE_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <input
            className="db-search"
            type="search"
            placeholder="Search by title, place or ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search reports"
          />

          {shown.length === 0 ? (
            <div className="db-empty">
              <p>No reports match this view.</p>
              <button
                className="db-btn"
                style={{ marginTop: 14 }}
                onClick={() => setOpen(true)}
              >
                Report an issue
              </button>
            </div>
          ) : (
            <ul className="db-list">
              {shown.map((it) => {
                const step = STAGES.indexOf(it.status);
                return (
                  <li className="db-item" key={it.id}>
                    <div className={`db-ico ${it.type}`} aria-hidden="true">
                      {TYPES[it.type]?.mark || "?"}
                    </div>
                    <div>
                      <h3>{it.title}</h3>
                      <p className="db-meta">
                        {it.place} · {it.date} · {it.id}
                      </p>
                      <div className="db-badges">
                        <span className="db-badge Pending">
                          {TYPES[it.type]?.label || "Other issue"}
                        </span>
                        <span className={`db-badge ${it.severity}`}>
                          {it.severity === "Pending"
                            ? "Severity pending"
                            : it.severity + " severity"}
                        </span>
                      </div>
                    </div>
                    <span className={`db-status ${it.status}`}>
                      {STAGE_LABEL[it.status]}
                    </span>
                    <div className="db-track" aria-hidden="true">
                      {STAGES.map((s, i) => (
                        <div key={s} className={i <= step ? "on" : ""}>
                          {STAGE_LABEL[s]}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {open && (
        <ReportModal onClose={() => setOpen(false)} onSubmit={addReport} />
      )}
      {toast && (
        <div className="db-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
