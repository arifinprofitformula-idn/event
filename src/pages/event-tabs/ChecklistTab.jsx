import React from "react";
import { STATUS_OPTIONS } from "../../model.js";
import { SelectInput, TextInput } from "../../components/ui.jsx";

export function ChecklistTab({ event, setEvent }) {
  const updateItem = (phase, index, patch) => {
    setEvent({
      ...event,
      checklist: {
        ...event.checklist,
        [phase]: event.checklist[phase].map((item, itemIndex) => (
          itemIndex === index ? { ...item, ...patch } : item
        ))
      }
    });
  };

  return (
    <div className="stack">
      {Object.entries(event.checklist).map(([phase, items]) => {
        const done = items.filter((item) => item.status === "Selesai").length;
        return (
          <section className="panel subtle" key={phase}>
            <div className="section-title">
              <h2>{phase}</h2>
              <span>{done}/{items.length}</span>
            </div>
            <div className="checklist">
              {items.map((item, index) => (
                <div className="check-item" key={`${phase}-${item.title}`}>
                  <SelectInput value={item.status} onChange={(inputEvent) => updateItem(phase, index, { status: inputEvent.target.value })}>
                    {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                  </SelectInput>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.pic}</span>
                  </div>
                  <TextInput type="date" value={item.deadline} onChange={(inputEvent) => updateItem(phase, index, { deadline: inputEvent.target.value })} />
                  <TextInput value={item.note} onChange={(inputEvent) => updateItem(phase, index, { note: inputEvent.target.value })} placeholder="Catatan" />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
