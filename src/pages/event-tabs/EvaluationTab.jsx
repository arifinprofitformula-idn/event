import React from "react";
import { STATUS_OPTIONS } from "../../model.js";
import { Field, SelectInput, TextArea, TextInput } from "../../components/ui.jsx";

export function EvaluationTab({ event, setEvent }) {
  const updateArray = (field, index, patch) => {
    setEvent({
      ...event,
      [field]: event[field].map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      ))
    });
  };

  const removeArray = (field, index) => {
    setEvent({ ...event, [field]: event[field].filter((_, itemIndex) => itemIndex !== index) });
  };

  return (
    <div className="stack">
      <section className="panel subtle">
        <div className="section-title">
          <h2>Temuan Utama</h2>
          <button
            className="button ghost"
            onClick={() => setEvent({ ...event, findings: [...event.findings, { area: "", priority: "Sedang", issue: "", impact: "" }] })}
          >
            Tambah
          </button>
        </div>
        {event.findings.map((finding, index) => (
          <div className="eval-row" key={index}>
            <TextInput value={finding.area} onChange={(inputEvent) => updateArray("findings", index, { area: inputEvent.target.value })} placeholder="Area" />
            <SelectInput value={finding.priority} onChange={(inputEvent) => updateArray("findings", index, { priority: inputEvent.target.value })}>
              <option>Tinggi</option>
              <option>Sedang</option>
              <option>Rendah</option>
            </SelectInput>
            <TextInput value={finding.issue} onChange={(inputEvent) => updateArray("findings", index, { issue: inputEvent.target.value })} placeholder="Temuan" />
            <TextInput value={finding.impact} onChange={(inputEvent) => updateArray("findings", index, { impact: inputEvent.target.value })} placeholder="Dampak" />
            <button className="icon-button danger" onClick={() => removeArray("findings", index)}>Hapus</button>
          </div>
        ))}
      </section>

      <section className="panel subtle">
        <div className="section-title">
          <h2>Rekomendasi</h2>
          <button
            className="button ghost"
            onClick={() => setEvent({ ...event, recommendations: [...event.recommendations, { text: "", pic: "", dueDate: "", status: "Belum" }] })}
          >
            Tambah
          </button>
        </div>
        {event.recommendations.map((rec, index) => (
          <div className="eval-row" key={index}>
            <TextInput value={rec.text} onChange={(inputEvent) => updateArray("recommendations", index, { text: inputEvent.target.value })} placeholder="Rekomendasi" />
            <TextInput value={rec.pic} onChange={(inputEvent) => updateArray("recommendations", index, { pic: inputEvent.target.value })} placeholder="PIC" />
            <TextInput type="date" value={rec.dueDate} onChange={(inputEvent) => updateArray("recommendations", index, { dueDate: inputEvent.target.value })} />
            <SelectInput value={rec.status} onChange={(inputEvent) => updateArray("recommendations", index, { status: inputEvent.target.value })}>
              {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </SelectInput>
            <button className="icon-button danger" onClick={() => removeArray("recommendations", index)}>Hapus</button>
          </div>
        ))}
      </section>

      <Field label="Kesimpulan & Next Action">
        <TextArea value={event.notes} onChange={(inputEvent) => setEvent({ ...event, notes: inputEvent.target.value })} placeholder="Tuliskan kesimpulan evaluasi..." />
      </Field>
    </div>
  );
}
