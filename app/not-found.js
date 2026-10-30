"use client"

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

      <section className="relative w-full max-w-xl text-center">
        {/* 404 illustration */}
        <div className="relative mx-auto mb-8 flex h-48 w-64 items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-blue-100" />

          <div className="relative flex items-center gap-2">
            <span className="text-7xl font-extrabold tracking-tight text-blue-600">
              4
            </span>

            <div className="flex h-24 w-24 items-center justify-center rounded-full border-10 border-blue-600 bg-white shadow-lg">
              <svg
                className="h-12 w-12 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
                <path d="M8.5 9.5h.01M13.5 9.5h.01" />
                <path d="M9 13s1-1.5 2-1.5 2 1.5 2 1.5" />
              </svg>
            </div>

            <span className="text-7xl font-extrabold tracking-tight text-blue-600">
              4
            </span>
          </div>

          <span className="absolute right-4 top-5 text-2xl text-blue-400">
            ✦
          </span>
          <span className="absolute bottom-5 left-5 text-xl text-indigo-400">
            ✦
          </span>
        </div>

        {/* Message */}
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Error 404
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Oops! Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-500">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 10 9-7 9 7" />
              <path d="M5 9v11h14V9" />
              <path d="M9 20v-7h6v7" />
            </svg>
            Back to Home
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
            Go Back
          </button>
        </div>

        <div className="mx-auto mt-12 h-px max-w-xs bg-slate-200" />

        <p className="mt-5 text-sm text-slate-400">
          Lost? Don't worry, we'll help you find your way.
        </p>
      </section>
    </main>
  );
}
