import React from "react";
import { STATUS_OPTIONS } from "../../model.js";
import { computeScore } from "../../utils.js";
import { SelectInput, TextInput } from "../../components/ui.jsx";

export function ScorecardTab({ event, setEvent }) {
  const updateMetric = (key, patch) => {
    setEvent({
      ...event,
      scorecard: event.scorecard.map((metric) => (
        metric.key === key ? { ...metric, ...patch } : metric
      ))
    });
  };
  const score = computeScore(event.scorecard);

  return (
    <div className="stack">
      <div className="score-box">
        <span>Skor Keseluruhan</span>
        <strong>{score}</strong>
        <small>dari 100</small>
      </div>
      {event.scorecard.map((metric) => (
        <div className="metric" key={metric.key}>
          <div>
            <strong>{metric.label}</strong>
            <span>Target: {metric.target}</span>
          </div>
          <TextInput value={metric.actual} onChange={(inputEvent) => updateMetric(metric.key, { actual: inputEvent.target.value })} placeholder="Realisasi" />
          <SelectInput value={metric.status} onChange={(inputEvent) => updateMetric(metric.key, { status: inputEvent.target.value })}>
            {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </SelectInput>
        </div>
      ))}
    </div>
  );
}
