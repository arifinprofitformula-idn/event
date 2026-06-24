import React from "react";
import { EVENT_STATUS } from "../model.js";
import { computeChecklistProgress, computeScore } from "../utils.js";
import { formatEventDate } from "../lib/format.js";
import { EmptyState, SelectInput, StatCard, TextInput } from "../components/ui.jsx";

export function Dashboard({ events, allEvents, filters, setFilters, onOpen, onNew, onExport, analytics }) {
  const brands = ["Semua", ...new Set(allEvents.map((event) => event.brand).filter(Boolean))];
  const statuses = ["Semua", ...EVENT_STATUS];

  return (
    <main className="screen">
      <section className="topbar">
        <div className="dashboard-brand">
          <img src="/epi-logo.png" alt="EPI Indonesia Bullion Ecosystem" />
          <div>
          <h1>Event Manager</h1>
          <p>Kontrol persiapan, evaluasi, dan pelaporan event dalam satu workspace.</p>
          </div>
        </div>
        <div className="actions">
          <button className="button secondary" onClick={onExport}>Export CSV</button>
          <button className="button primary" onClick={onNew}>Event Baru</button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total Event" value={analytics.total} />
        <StatCard label="Selesai" value={analytics.done} tone="green" />
        <StatCard label="Avg. Score" value={`${analytics.avgScore}%`} tone="blue" />
        <StatCard label="Follow-up Pending" value={analytics.pendingFollowUps} tone="amber" />
      </section>

      <section className="toolbar">
        <TextInput
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          placeholder="Cari nama event, speaker, atau PIC..."
        />
        <SelectInput value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}>
          {brands.map((brand) => <option key={brand}>{brand}</option>)}
        </SelectInput>
        <SelectInput value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </SelectInput>
      </section>

      {allEvents.length === 0 ? (
        <EmptyState
          title="Belum ada event"
          text="Buat event pertama untuk mulai mengelola checklist, scorecard, evaluasi, dan report."
          action={<button className="button primary" onClick={onNew}>Buat Event</button>}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="Tidak ada hasil"
          text="Coba ubah kata kunci pencarian atau filter event."
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
