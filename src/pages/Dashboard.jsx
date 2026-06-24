import React from "react";
import { EVENT_STATUS } from "../model.js";
import { computeChecklistProgress, computeScore } from "../utils.js";
import { formatEventDate } from "../lib/format.js";
import { SelectInput, TextInput } from "../components/ui.jsx";
import { UserBadge } from "../components/UserBadge.jsx";

const icons = {
  total: "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13Zm4 2v2h8v-2H8Zm0 5v2h8v-2H8Z",
  done: "m9.2 16.4-4.1-4.1 1.4-1.4 2.7 2.7 8.3-8.3 1.4 1.4-9.7 9.7Z",
  score: "M12 2 4.7 5.1 3.6 13 12 22l8.4-9-1.1-7.9L12 2Zm0 4.4 3.5 1.5.5 3.8-4 4.3-4-4.3.5-3.8L12 6.4Z",
  follow: "M5 4h14v10H8l-3 3V4Zm3 13h9v2H8v-2Z"
};

function DashboardIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function PremiumStatCard({ label, value, helper, tone, icon }) {
  return (
    <article className={`stat premium-stat ${tone}`}>
      <div className="stat-icon"><DashboardIcon path={icon} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function DashboardEmpty({ title, text, onNew, filtered }) {
  return (
    <section className="empty dashboard-empty">
      <div className="empty-illustration" aria-hidden="true">
        <span></span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {!filtered && <button className="button primary" onClick={onNew}>Buat Event Pertama</button>}
    </section>
  );
}

export function Dashboard({ events, allEvents, filters, setFilters, onOpen, onNew, onExport, analytics, session, onLogout, onSettings }) {
  const brands = ["Semua", ...new Set(allEvents.map((event) => event.brand).filter(Boolean))];
  const statuses = ["Semua", ...EVENT_STATUS];

  return (
    <main className="screen dashboard-shell">
      <section className="topbar dashboard-topbar">
        <div className="dashboard-brand">
          <img src="/epi-logo.png" alt="EPI Indonesia Bullion Ecosystem" />
          <div>
            <span className="eyebrow">Indonesian Bullion Ecosystem</span>
            <h1>Event Manager</h1>
            <p>Executive workspace untuk operasional event, evaluasi, dan reporting.</p>
          </div>
        </div>
        <div className="actions header-actions">
          <button className="button secondary" onClick={onExport}>Export CSV</button>
          <button className="button primary" onClick={onNew}>Event Baru</button>
          <button className="button secondary" onClick={onSettings}>Pengaturan</button>
          <UserBadge session={session} onLogout={onLogout} compact />
        </div>
      </section>

      <section className="hero-panel">
        <div>
          <span className="workspace-badge">Realtime Workspace</span>
          <h2>Event Operations Center</h2>
          <p>Pantau persiapan, evaluasi, scorecard, dan follow-up event dalam satu workspace.</p>
        </div>
        <div className="hero-actions">
          <button className="button secondary" onClick={onExport}>Export CSV</button>
          <button className="button primary" onClick={onNew}>Event Baru</button>
        </div>
      </section>

      <section className="stats-grid kpi-grid">
        <PremiumStatCard label="Total Event" value={analytics.total} helper="Seluruh event dalam workspace" tone="navy" icon={icons.total} />
        <PremiumStatCard label="Selesai" value={analytics.done} helper="Event yang sudah ditutup" tone="green" icon={icons.done} />
        <PremiumStatCard label="Avg. Score" value={`${analytics.avgScore}%`} helper="Rata-rata performa scorecard" tone="blue" icon={icons.score} />
        <PremiumStatCard label="Follow-up Pending" value={analytics.pendingFollowUps} helper="Rekomendasi belum selesai" tone="amber" icon={icons.follow} />
      </section>

      <section className="control-panel">
        <div className="control-heading">
          <div>
            <h2>Event Registry</h2>
            <p>Temukan event, cek status, dan buka detail operasional.</p>
          </div>
          <span>{events.length} ditampilkan</span>
        </div>
        <div className="toolbar control-bar">
          <div className="search-wrap">
            <DashboardIcon path="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
            <TextInput
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="Cari nama event, speaker, atau PIC..."
            />
          </div>
          <label className="filter-field">
            <span>Brand</span>
            <SelectInput value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}>
              {brands.map((brand) => <option key={brand}>{brand}</option>)}
            </SelectInput>
          </label>
          <label className="filter-field">
            <span>Status</span>
            <SelectInput value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </SelectInput>
          </label>
        </div>
      </section>

      {allEvents.length === 0 ? (
        <DashboardEmpty
          title="Belum ada event"
          text="Buat event pertama untuk mulai mengelola checklist, scorecard, evaluasi, dan report."
          onNew={onNew}
        />
      ) : events.length === 0 ? (
        <DashboardEmpty
          title="Tidak ada hasil"
          text="Coba ubah kata kunci pencarian atau filter event."
          filtered
        />
      ) : (
        <section className="event-list">
          {events.map((event) => {
            const progress = computeChecklistProgress(event.checklist);
            const score = computeScore(event.scorecard);
            return (
              <button className="event-row" key={event.id} onClick={() => onOpen(event)}>
                <div className="event-main">
                  <strong>{event.name || "Untitled Event"}</strong>
                  <span>{event.brand} · {event.type} · {formatEventDate(event.date)}</span>
                </div>
                <div className="event-meta">
                  <span className="pill">{event.status}</span>
                  <span>{progress}% checklist</span>
                  <span>{score}% score</span>
                </div>
              </button>
            );
          })}
        </section>
      )}
    </main>
  );
}
