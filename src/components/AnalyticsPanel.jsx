import React from "react";

function BreakdownList({ title, items }) {
  return (
    <div className="analytics-card">
      <h3>{title}</h3>
      {items.length ? items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      )) : <p>Belum ada data.</p>}
    </div>
  );
}

function RiskList({ riskEvents }) {
  return (
    <div className="analytics-card wide">
      <h3>Event Berisiko</h3>
      {riskEvents.length ? riskEvents.map(({ event, risk }) => (
        <div className="risk-row" key={event.id}>
          <div>
            <strong>{event.name || "Untitled Event"}</strong>
            <span>{event.brand} · {risk.reasons.join(", ")}</span>
          </div>
          <span className={`risk-badge ${risk.level.toLowerCase()}`}>{risk.level}</span>
        </div>
      )) : <p>Tidak ada event berisiko saat ini.</p>}
    </div>
  );
}

function FollowUpList({ recommendations }) {
  return (
    <div className="analytics-card wide">
      <h3>Follow-up Terbuka</h3>
      {recommendations.length ? recommendations.map((item, index) => (
        <div className="follow-row" key={`${item.eventId}-${index}`}>
          <div>
            <strong>{item.text || "Rekomendasi belum diisi"}</strong>
            <span>{item.eventName} · {item.pic || "PIC belum diset"} · {item.status}</span>
          </div>
          <span>{item.dueDate || "Tanpa deadline"}</span>
        </div>
      )) : <p>Tidak ada follow-up terbuka.</p>}
    </div>
  );
}

export function AnalyticsPanel({ analytics }) {
  return (
    <section className="panel">
      <div className="section-title">
        <h2>Analisa Tim</h2>
        <span>Insight otomatis</span>
      </div>
      <div className="insights">
        {analytics.insights.map((item) => (
          <div className="insight" key={item}>{item}</div>
        ))}
      </div>
      <div className="analytics-grid">
        <BreakdownList title="Per Brand" items={analytics.byBrand} />
        <BreakdownList title="Per Status" items={analytics.byStatus} />
        <BreakdownList title="Per Platform" items={analytics.byPlatform} />
        <RiskList riskEvents={analytics.riskEvents} />
        <FollowUpList recommendations={analytics.openRecommendations} />
      </div>
    </section>
  );
}
