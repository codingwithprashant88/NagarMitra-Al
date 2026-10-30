"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
});

const TYPES = {
  pothole: "Pothole",
  road: "Road damage",
  light: "Streetlight",
  garbage: "Garbage",
  other: "Other",
};

const MARK = {
  pothole: "P",
  road: "R",
  light: "L",
  garbage: "G",
  other: "O",
};

const COLOR = {
  pothole: "#e5533d",
  road: "#2f7fb5",
  light: "#f5a623",
  garbage: "#0f9d8a",
  other: "#64748b",
};

const TEAMS = {
  pothole: ["Roads Team A", "Roads Team B"],
  road: ["Roads Team A", "Roads Team B"],
  light: ["Lighting Crew 1", "Lighting Crew 2"],
  garbage: ["Sanitation Unit 1", "Sanitation Unit 2"],
  other: [
    "Roads Team A",
    "Roads Team B",
    "Lighting Crew 1",
    "Lighting Crew 2",
    "Sanitation Unit 1",
    "Sanitation Unit 2",
  ],
};

const ALL_TEAMS = [...new Set(Object.values(TEAMS).flat())];

const STATUS = {
  Reported: "Reported",
  Assigned: "Assigned",
  Progress: "In progress",
  Resolved: "Resolved",
};

const RANK = {
  High: 3,
  Medium: 2,
  Low: 1,
  Pending: 0,
};

function Ic({ n, s = 20 }) {
  const paths = {
    grid: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.5 3.5 5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 2.5 20h19z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 13 6.5 5h11L20 13v6H4z" />
        <path d="M4 13h5l1 2h4l1-2h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
  };

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[n]}
    </svg>
  );
}

/* ---------------- Weekly chart ---------------- */

function Trend() {
  const [weekly, setWeekly] = useState({
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    received: [0, 0, 0, 0, 0, 0, 0],
    resolved: [0, 0, 0, 0, 0, 0, 0],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load chart");
      }

      if (data.weekly) {
        setWeekly({
          days: data.weekly.days || [],
          received: data.weekly.received || [],
          resolved: data.weekly.resolved || [],
        });
      }
    } catch (error) {
      setError(error.message || "Unable to load chart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  if (loading) {
    return <div className="ax-empty">Loading weekly chart...</div>;
  }

  if (error) {
    return (
      <div className="ax-empty">
        <p>{error}</p>
        <button className="ax-link" onClick={loadChart}>
          Retry
        </button>
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const left = 42;
  const right = 20;
  const top = 20;
  const bottom = 38;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const count = weekly.days.length;

  const values = [...weekly.received, ...weekly.resolved].map(
    (value) => Number(value) || 0,
  );

  const max = Math.max(5, ...values);
  const yMax = Math.ceil(max / 5) * 5;

  const x = (index) =>
    left + (count <= 1 ? chartWidth / 2 : (index / (count - 1)) * chartWidth);

  const y = (value) =>
    top + chartHeight - ((Number(value) || 0) / yMax) * chartHeight;

  const makePath = (data) =>
    data
      .map(
        (value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`,
      )
      .join(" ");

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center gap-5 text-sm">
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Reports received
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Reports resolved
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Weekly reports received and resolved"
        >
          {Array.from({ length: 5 }, (_, index) => {
            const value = (yMax / 4) * index;
            const gridY = y(value);

            return (
              <g key={index}>
                <line
                  x1={left}
                  y1={gridY}
                  x2={width - right}
                  y2={gridY}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={left - 10}
                  y={gridY + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          <path
            d={makePath(weekly.received)}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={makePath(weekly.resolved)}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {weekly.days.map((day, index) => (
            <g key={day}>
              <circle
                cx={x(index)}
                cy={y(weekly.received[index])}
                r="4"
                fill="#2563eb"
              >
                <title>
                  {day}: {weekly.received[index] || 0} received
                </title>
              </circle>

              <circle
                cx={x(index)}
                cy={y(weekly.resolved[index])}
                r="4"
                fill="#10b981"
              >
                <title>
                  {day}: {weekly.resolved[index] || 0} resolved
                </title>
              </circle>

              <text
                x={x(index)}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ---------------- Issue type donut ---------------- */

function Donut({ items }) {
  const total = items.length;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="ax-donut">
      <svg
        width="160"
        height="160"
        viewBox="0 0 120 120"
        role="img"
        aria-label="Complaints by issue type"
      >
        <g transform="rotate(-90 60 60)">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e8eef1"
            strokeWidth="16"
          />

          {Object.keys(TYPES)
            .filter((type) => type !== "other")
            .map((type) => {
              const number = items.filter((item) => item.type === type).length;

              const length = total > 0 ? (number / total) * circumference : 0;

              const element =
                number > 0 ? (
                  <circle
                    key={type}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={COLOR[type]}
                    strokeWidth="16"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                  />
                ) : null;

              offset += length;
              return element;
            })}
        </g>

        <text
          x="60"
          y="58"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#0e2a3b"
        >
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#5d7683">
          complaints
        </text>
      </svg>

      <div className="ax-dl">
        {Object.entries(TYPES)
          .filter(([type]) => type !== "other")
          .map(([type, label]) => (
            <div key={type}>
              <i style={{ background: COLOR[type] }} />
              {label}
              <b>{items.filter((item) => item.type === type).length}</b>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ---------------- Complaint drawer ---------------- */

function Drawer({ item, onClose, onSave, saving }) {
  const [status, setStatus] = useState(item.status);
  const [team, setTeam] = useState(item.team || "");
  const [note, setNote] = useState(item.note || "");

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, saving]);

  const teams = TEAMS[item.type] || ALL_TEAMS;

  return (
    <div
      className="ax-overlay"
      onClick={(event) =>
        event.target === event.currentTarget && !saving && onClose()
      }
    >
      <aside
        className="ax-drawer flex h-full w-full flex-col overflow-hidden bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ax-dt"
      >
        {/* Header */}
        <div className="ax-dh flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Complaint details
            </p>

            <h2
              id="ax-dt"
              className="wrap-break-word text-lg font-bold leading-snug text-slate-900 sm:text-xl"
            >
              {item.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">ID: {item.id}</p>
          </div>

          <button
            type="button"
            className="ax-x flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
            aria-label="Close complaint details"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {/* Photo */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Report photo
            </h3>

            <div className="relative flex min-h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:min-h-52">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={`Complaint photo: ${item.title}`}
                  className="block max-h-80 w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-slate-500">
                  <svg
                    className="h-10 w-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9" r="1.5" />
                    <path d="m21 15-5-5L5 20" />
                  </svg>

                  <p className="text-sm font-medium">
                    No complaint photo available
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Complaint information */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Complaint information
            </h3>

            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">
                  Issue type
                </dt>
                <dd className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                  {TYPES[item.type] || item.type || "Other"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">Severity</dt>
                <dd className="mt-1">
                  <span className={`ax-pill ${item.severity}`}>
                    {item.severity || "Pending"}
                  </span>
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">Location</dt>
                <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
                  {item.place || "Location unavailable"}
                </dd>
                {item.ward && item.ward !== "—" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Ward: {item.ward}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">
                  Reported by
                </dt>
                <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
                  {item.by || "Citizen"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">Reported</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {item.age ?? 0} day{item.age === 1 ? "" : "s"} ago
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">
                  Duplicate reports
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {item.dup > 1 ? `${item.dup} reports merged` : "None"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Citizen description */}
          {item.citizenNote && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Citizen description
              </h3>

              <p className="whitespace-pre-wrap wrap-break-word rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                {item.citizenNote}
              </p>
            </section>
          )}

          {/* Assignment */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Manage complaint
            </h3>

            <div className="ax-field space-y-2">
              <label
                htmlFor="ax-team"
                className="block text-sm font-medium text-slate-700"
              >
                Assign to team
              </label>

              <select
                id="ax-team"
                className="ax-sel w-full"
                value={team}
                disabled={saving}
                onChange={(event) => {
                  const nextTeam = event.target.value;
                  setTeam(nextTeam);

                  if (nextTeam && status === "Reported") {
                    setStatus("Assigned");
                  }
                }}
              >
                <option value="">Unassigned</option>

                {teams.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ax-field space-y-2">
              <label
                htmlFor="ax-st"
                className="block text-sm font-medium text-slate-700"
              >
                Complaint status
              </label>

              <select
                id="ax-st"
                className="ax-sel w-full"
                value={status}
                disabled={saving}
                onChange={(event) => setStatus(event.target.value)}
              >
                {Object.entries(STATUS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ax-field space-y-2">
              <label
                htmlFor="ax-note"
                className="block text-sm font-medium text-slate-700"
              >
                Internal note
                <span className="ml-2 font-normal text-slate-400">
                  (Staff only)
                </span>
              </label>

              <textarea
                id="ax-note"
                className="ax-area min-h-28 w-full resize-y"
                value={note}
                disabled={saving}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add an update or instructions for the assigned team..."
              />

              <p className="text-right text-xs text-slate-400">
                {note.length}/2000 characters
              </p>
            </div>
          </section>
        </div>

        {/* Fixed footer */}
        <div className="ax-btns flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            className="ax-btn ghost w-full sm:w-auto"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="ax-btn w-full sm:w-auto"
            disabled={saving}
            onClick={() => onSave({ ...item, status, team, note })}
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Admin dashboard ---------------- */

export default function AdminDashboard() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [view, setView] = useState("overview");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("All");
  const [selId, setSelId] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [admin, setAdmin] = useState({
    name: "Admin",
    dept: "Admin",
  });

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/complaints", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load complaints");
      }

      const normalized = (data.complaints || []).map((report) => ({
        ...report,
        id: report.id,
        mongoId: report.mongoId,
        type: report.type,
        title: report.title || "Civic issue",
        place: report.place || "Location unavailable",
        ward: report.ward || "—",
        by: report.by || "Citizen",
        age: Number(report.age) || 0,
        severity: report.severity || "Pending",
        status: report.status || "Reported",
        team: report.team || "",
        dup: Number(report.dup) || 1,
        note: report.note || "",
        photoUrl: report.photoUrl || "",
      }));

      setItems(normalized);
    } catch (err) {
      setError(err.message || "Unable to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    async function loadAdmin() {
      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success && data.admin) {
          setAdmin({
            name: data.admin.name || "Admin",
            dept: data.admin.department || data.admin.role || "Admin",
          });
        }
      } catch (err) {
        console.error("ADMIN PROFILE LOAD ERROR:", err);
      }
    }

    loadAdmin();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleLogout(event) {
    event?.preventDefault();

    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setToast("Unable to logout. Please try again.");
    }
  }

  async function update(next, message) {
    if (saving) return false;

    if (!next.mongoId) {
      setToast("Complaint MongoDB ID is missing");
      return false;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/complaints/${next.mongoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: next.status,
          team: next.team,
          note: next.note,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update complaint");
      }

      setItems((current) =>
        current.map((item) =>
          item.mongoId === next.mongoId
            ? {
                ...item,
                status: data.complaint.status,
                team: data.complaint.team,
                note: data.complaint.note,
              }
            : item,
        ),
      );

      setToast(message || `${next.id} updated successfully`);
      return true;
    } catch (err) {
      setToast(err.message || "Unable to update complaint");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function quickAssign(item, team) {
    await update(
      {
        ...item,
        team,
        status: team && item.status === "Reported" ? "Assigned" : item.status,
      },
      `${item.id} assignment updated`,
    );
  }

  const open = items.filter((item) => item.status !== "Resolved");
  const unassigned = open.filter((item) => !item.team);

  const queue = [...open]
    .sort(
      (a, b) =>
        (RANK[b.severity] || 0) - (RANK[a.severity] || 0) ||
        b.dup - a.dup ||
        a.age - b.age,
    )
    .slice(0, 5);

  const shown = useMemo(() => {
    const search = q.trim().toLowerCase();

    return items
      .filter(
        (item) =>
          (fStatus === "All" || item.status === fStatus) &&
          `${item.title} ${item.place} ${item.ward} ${item.id} ${item.by} ${item.type}`
            .toLowerCase()
            .includes(search),
      )
      .sort(
        (a, b) =>
          (RANK[b.severity] || 0) - (RANK[a.severity] || 0) || b.dup - a.dup,
      );
  }, [items, q, fStatus]);

  const selected = items.find((item) => item.id === selId);

  const nav = [
    ["overview", "Overview", "grid"],
    ["complaints", "Complaints", "list"],
    ["teams", "Teams", "users"],
  ];

  const titles = {
    overview: [
      `Good morning, ${admin.name.split(" ")[0]}`,
      "Here is what needs attention today.",
    ],
    complaints: ["Complaints", "Review, assign and close citizen reports."],
    teams: ["Teams", "See how busy each field team is."],
  };

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      try {
        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.admin) {
          router.replace("/admin/login");
          return;
        }

        if (!cancelled) {
          setAdmin({
            name: data.admin.name || "Admin",
            dept: data.admin.department || data.admin.role || "Admin",
          });

          setIsAdmin(true);
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying admin session...
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`ax-site ${display.variable} ${body.variable}`}>
      <aside className="ax-side">
        <Link href="/" className="ax-brand">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
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

        <nav className="ax-nav" aria-label="Admin">
          {nav.map(([key, label, icon]) => (
            <button
              key={key}
              aria-current={view === key ? "page" : undefined}
              onClick={() => setView(key)}
            >
              <Ic n={icon} />
              {label}

              {key === "complaints" && unassigned.length > 0 && (
                <span className="ax-badge">{unassigned.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="ax-me">
          <span className="ax-av" aria-hidden="true">
            {admin.name[0]}
          </span>

          <div>
            <strong>{admin.name}</strong>
            <small>{admin.dept}</small>
          </div>

          <a
            href="/admin/login"
            onClick={handleLogout}
            className="ax-out"
            aria-disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </a>
        </div>
      </aside>

      <main className="ax-main">
        <div className="ax-mtop">
          <span className="ax-brand">
            <span>
              CivicFix <b>AI</b>
            </span>
          </span>

          <a href="/admin/login" onClick={handleLogout} className="ax-out">
            {loggingOut ? "Logging out..." : "Log out"}
          </a>
        </div>

        <div className="ax-bar">
          <div>
            <h1>{titles[view][0]}</h1>
            <p>{titles[view][1]}</p>
          </div>

          {view === "complaints" && (
            <label className="ax-search">
              <Ic n="search" s={18} />
              <input
                type="search"
                placeholder="Search ID, place, ward or reporter"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                aria-label="Search complaints"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="ax-card">
            <p className="text-sm text-red-600">{error}</p>
            <button
              className="ax-link"
              onClick={loadReports}
              disabled={loading}
            >
              {loading ? "Loading..." : "Retry loading complaints"}
            </button>
          </div>
        )}

        {view === "overview" && (
          <>
            <section className="ax-kpis" aria-label="Summary">
              <div className="ax-kpi hero">
                <div className="ax-ico w">
                  <Ic n="alert" />
                </div>
                <span>Need attention</span>
                <strong>{loading ? "—" : unassigned.length}</strong>
                <small>unassigned complaints waiting</small>
              </div>

              <div className="ax-kpi">
                <div className="ax-ico t">
                  <Ic n="inbox" />
                </div>
                <span>Total reports</span>
                <strong>{loading ? "—" : items.length}</strong>
                <small>{open.length} still open</small>
              </div>

              <div className="ax-kpi">
                <div className="ax-ico a">
                  <Ic n="clock" />
                </div>
                <span>In progress</span>
                <strong>
                  {items.filter((item) => item.status === "Progress").length}
                </strong>
                <small>being fixed now</small>
              </div>

              <div className="ax-kpi">
                <div className="ax-ico t">
                  <Ic n="check" />
                </div>
                <span>Resolved</span>
                <strong>
                  {items.filter((item) => item.status === "Resolved").length}
                </strong>
                <small>marked resolved</small>
              </div>
            </section>

            <section className="ax-grid2">
              <div className="ax-card">
                <div className="ax-card-h">
                  <h2>This week</h2>
                  <div className="ax-legend">
                    <span>
                      <i style={{ background: "#2563eb" }} />
                      Received
                    </span>
                    <span>
                      <i style={{ background: "#0f9d8a" }} />
                      Resolved
                    </span>
                  </div>
                </div>
                <Trend />
              </div>

              <div className="ax-card">
                <div className="ax-card-h">
                  <h2>By issue type</h2>
                </div>
                {loading ? (
                  <p className="ax-empty">Loading issue statistics...</p>
                ) : (
                  <Donut items={items} />
                )}
              </div>
            </section>

            <section className="ax-grid3">
              <div className="ax-card">
                <div className="ax-card-h">
                  <h2>Priority queue</h2>
                  <button
                    className="ax-link"
                    onClick={() => setView("complaints")}
                  >
                    View all
                  </button>
                </div>

                {loading ? (
                  <p className="ax-empty">Loading complaints...</p>
                ) : queue.length === 0 ? (
                  <p className="ax-empty">No open complaints.</p>
                ) : (
                  <ul className="ax-q">
                    {queue.map((item) => (
                      <li
                        key={item.mongoId}
                        className={`ax-qi ${item.severity}`}
                        onClick={() => setSelId(item.id)}
                      >
                        <span
                          className="ax-t"
                          style={{
                            background: COLOR[item.type] || COLOR.other,
                          }}
                          aria-hidden="true"
                        >
                          {MARK[item.type] || "O"}
                        </span>

                        <div>
                          <h3>{item.title}</h3>
                          <p className="ax-muted">
                            {item.place}, {item.ward} · {item.severity} ·{" "}
                            {item.dup} report{item.dup === 1 ? "" : "s"}
                          </p>
                        </div>

                        <select
                          className="ax-sel"
                          value={item.team}
                          aria-label={`Assign ${item.id}`}
                          disabled={saving}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            quickAssign(item, event.target.value)
                          }
                        >
                          <option value="">Assign...</option>
                          {(TEAMS[item.type] || ALL_TEAMS).map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ax-card">
                <div className="ax-card-h">
                  <h2>Recent activity</h2>
                </div>

                <ul className="ax-feed">
                  {[...items]
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0) -
                        new Date(a.updatedAt || a.createdAt || 0),
                    )
                    .slice(0, 5)
                    .map((item) => (
                      <li key={item.mongoId}>
                        <i
                          style={{
                            background: COLOR[item.type] || COLOR.other,
                          }}
                        />
                        <div>
                          {item.title}
                          <small>
                            {STATUS[item.status] || item.status} · {item.place}
                          </small>
                        </div>
                      </li>
                    ))}

                  {!loading && items.length === 0 && (
                    <li>No recent activity.</li>
                  )}
                </ul>
              </div>
            </section>
          </>
        )}

        {view === "complaints" && (
          <div className="ax-card">
            <div className="ax-filters">
              {["All", ...Object.keys(STATUS)].map((status) => (
                <button
                  key={status}
                  className="ax-chip"
                  aria-pressed={fStatus === status}
                  onClick={() => setFStatus(status)}
                >
                  {status === "All" ? "All" : STATUS[status]}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="ax-empty">Loading complaints...</p>
            ) : error ? (
              <p className="ax-empty">Unable to load complaints.</p>
            ) : shown.length === 0 ? (
              <p className="ax-empty">No complaints match.</p>
            ) : (
              <div className="ax-tw">
                <table className="ax-table">
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Assigned to</th>
                      <th>Age</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {shown.map((item) => (
                      <tr
                        className="row"
                        key={item.mongoId}
                        onClick={() => setSelId(item.id)}
                      >
                        <td className="main" data-label="Issue">
                          <div className="ax-title">
                            {item.title}
                            {item.dup > 1 && (
                              <span className="ax-dup">{item.dup} reports</span>
                            )}
                          </div>
                          <div className="ax-muted">
                            {TYPES[item.type] || item.type} · {item.place},{" "}
                            {item.ward} · {item.id}
                          </div>
                        </td>

                        <td data-label="Severity">
                          <span className={`ax-pill ${item.severity}`}>
                            {item.severity}
                          </span>
                        </td>

                        <td data-label="Status">
                          <span className={`ax-pill ${item.status}`}>
                            {STATUS[item.status] || item.status}
                          </span>
                        </td>

                        <td data-label="Assigned to">
                          {item.team || (
                            <span className="ax-muted">Unassigned</span>
                          )}
                        </td>

                        <td data-label="Age">{item.age}d</td>

                        <td className="act">
                          <button
                            className="ax-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelId(item.id);
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "teams" && (
          <section className="ax-teams">
            {ALL_TEAMS.map((team) => {
              const assigned = items.filter((item) => item.team === team);
              const active = assigned.filter(
                (item) => item.status !== "Resolved",
              ).length;

              return (
                <div className="ax-card ax-team" key={team}>
                  <h3>{team}</h3>

                  <div className="ax-meter" aria-hidden="true">
                    <i
                      style={{
                        width: `${Math.min(100, active * 25)}%`,
                        background:
                          active >= 3 ? "var(--coral)" : "var(--teal)",
                      }}
                    />
                  </div>

                  <div className="nums">
                    <span>{active} active</span>
                    <span>{assigned.length - active} resolved</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {selected && (
        <Drawer
          key={selected.mongoId}
          item={selected}
          saving={saving}
          onClose={() => setSelId(null)}
          onSave={async (next) => {
            const success = await update(next);
            if (success) setSelId(null);
          }}
        />
      )}

      {toast && (
        <div className="ax-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
