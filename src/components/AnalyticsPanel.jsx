import React from "react";

function BreakdownList({ title, items }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-head">
        <h3>{title}</h3>
        <span>{items.length ? `${items.length} kategori` : "Kosong"}</span>
      </div>
      {items.length ? items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      )) : <p className="mini-empty">Belum ada data untuk divisualisasikan.</p>}
    </div>
  );
}

function RiskList({ riskEvents }) {
  return (
    <div className="analytics-card wide risk-panel">
      <div className="analytics-card-head">
        <h3>Event Berisiko</h3>
        <span>Operational watchlist</span>
      </div>
      {riskEvents.length ? riskEvents.map(({ event, risk }) => (
        <div className="risk-row" key={event.id}>
          <div>
            <strong>{event.name || "Untitled Event"}</strong>
            <span>{event.brand} · {risk.reasons.join(", ")}</span>
          </div>
          <span className={`risk-badge ${risk.level.toLowerCase()}`}>{risk.level}</span>
        </div>
      )) : <p className="mini-empty">Tidak ada event berisiko saat ini.</p>}
    </div>
  );
}

function FollowUpList({ recommendations }) {
  return (
    <div className="analytics-card wide follow-panel">
      <div className="analytics-card-head">
        <h3>Follow-up Terbuka</h3>
        <span>Action tracker</span>
      </div>
      {recommendations.length ? recommendations.map((item, index) => (
        <div className="follow-row" key={`${item.eventId}-${index}`}>
          <div>
            <strong>{item.text || "Rekomendasi belum diisi"}</strong>
            <span>{item.eventName} · {item.pic || "PIC belum diset"} · {item.status}</span>
          </div>
          <span>{item.dueDate || "Tanpa deadline"}</span>
        </div>
      )) : <p className="mini-empty">Tidak ada follow-up terbuka.</p>}
    </div>
  );
}

export function AnalyticsPanel({ analytics }) {
  return (
    <section className="panel analytics-section">
      <div className="section-title analytics-title">
        <div>
          <span className="eyebrow">Insight Otomatis</span>
          <h2>Analisa Tim</h2>
          <p>Insight otomatis untuk membantu tim bergerak lebih cepat dan terukur.</p>
        </div>
        <span className="workspace-badge">Insight otomatis</span>
      </div>
      <div className="insights">
        {analytics.insights.map((item, index) => (
          <div className="insight" key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
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
