import React from "react";
import { useState } from "react";
import { ChecklistTab } from "./event-tabs/ChecklistTab.jsx";
import { EvaluationTab } from "./event-tabs/EvaluationTab.jsx";
import { InfoTab } from "./event-tabs/InfoTab.jsx";
import { ReportTab } from "./event-tabs/ReportTab.jsx";
import { ScorecardTab } from "./event-tabs/ScorecardTab.jsx";
import { StreamingTab } from "./event-tabs/StreamingTab.jsx";

const TABS = [
  ["info", "Info"],
  ["streaming", "Streaming"],
  ["checklist", "Checklist"],
  ["scorecard", "Scorecard"],
  ["evaluation", "Evaluasi"],
  ["report", "Report"]
];

export function EventDetail({ event, setEvent, settings, onBack, onSave, onDelete }) {
  const [tab, setTab] = useState("info");
  const update = (key, value) => setEvent({ ...event, [key]: value });

  return (
    <main className="screen">
      <section className="detail-top">
        <button className="button secondary" onClick={onBack}>Kembali</button>
        <div>
          <h1>{event.name || "Event Baru"}</h1>
          <p>{event.brand} · {event.status}</p>
        </div>
        <div className="actions">
          <button className="button danger" onClick={onDelete}>Hapus</button>
          <button className="button primary" onClick={() => onSave(event)}>Simpan</button>
        </div>
      </section>

      <nav className="tabs">
        {TABS.map(([key, label]) => (
          <button className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {tab === "info" && <InfoTab event={event} update={update} settings={settings} />}
        {tab === "streaming" && <StreamingTab event={event} update={update} settings={settings} />}
        {tab === "checklist" && <ChecklistTab event={event} setEvent={setEvent} />}
        {tab === "scorecard" && <ScorecardTab event={event} setEvent={setEvent} />}
        {tab === "evaluation" && <EvaluationTab event={event} setEvent={setEvent} />}
        {tab === "report" && <ReportTab event={event} />}
      </section>
    </main>
  );
}
