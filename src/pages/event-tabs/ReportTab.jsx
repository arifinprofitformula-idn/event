import React from "react";
import { StatCard } from "../../components/ui.jsx";
import { formatEventDate } from "../../lib/format.js";
import { computeChecklistProgress, computeScore, printReport } from "../../utils.js";

export function ReportTab({ event }) {
  return (
    <div className="report">
      <div className="report-head">
        <div>
          <h2>{event.name || "Untitled Event"}</h2>
          <p>{event.brand} · {event.type} · {formatEventDate(event.date)}</p>
        </div>
        <button className="button secondary" onClick={() => printReport(event)}>Print / PDF</button>
      </div>
      <div className="report-grid">
        <StatCard label="Checklist" value={`${computeChecklistProgress(event.checklist)}%`} />
        <StatCard label="Score" value={`${computeScore(event.scorecard)}%`} />
        <StatCard label="Status" value={event.status} />
      </div>
      <h3>Temuan</h3>
      {event.findings.length ? event.findings.map((item, index) => (
        <p key={index}><strong>{item.area || "Area"}:</strong> {item.issue} {item.impact && `(${item.impact})`}</p>
      )) : <p>Belum ada temuan.</p>}
      <h3>Rekomendasi</h3>
      {event.recommendations.length ? event.recommendations.map((item, index) => (
        <p key={index}><strong>{item.pic || "PIC"}:</strong> {item.text} · {item.status}</p>
      )) : <p>Belum ada rekomendasi.</p>}
      <h3>Kesimpulan</h3>
      <p>{event.notes || "Belum ada kesimpulan."}</p>
    </div>
  );
}
