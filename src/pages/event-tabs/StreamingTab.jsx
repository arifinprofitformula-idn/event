import React from "react";
import { Field, TextInput } from "../../components/ui.jsx";

export function StreamingTab({ event, update, settings }) {
  return (
    <div className="stack">
      <section className="panel subtle">
        <div className="section-title">
          <h2>Zoom</h2>
          <span>{event.platform}</span>
        </div>
        <div className="form-grid">
          <Field label="Meeting ID">
            <TextInput value={event.zoom.id} onChange={(inputEvent) => update("zoom", { ...event.zoom, id: inputEvent.target.value })} />
          </Field>
          <Field label="Password">
            <TextInput value={event.zoom.password} onChange={(inputEvent) => update("zoom", { ...event.zoom, password: inputEvent.target.value })} />
          </Field>
          <Field label="Link Zoom">
            <TextInput value={event.zoom.link} onChange={(inputEvent) => update("zoom", { ...event.zoom, link: inputEvent.target.value })} />
          </Field>
        </div>
      </section>

      <section className="panel subtle">
        <div className="section-title">
          <h2>YouTube</h2>
          <span>{settings.ytChannels[event.brand] || "Channel belum diset"}</span>
        </div>
        <div className="form-grid">
          <Field label="Judul Live / Replay">
            <TextInput value={event.youtube.title} onChange={(inputEvent) => update("youtube", { ...event.youtube, title: inputEvent.target.value })} />
          </Field>
          <Field label="Stream Key">
            <TextInput type="password" value={event.youtube.streamKey} onChange={(inputEvent) => update("youtube", { ...event.youtube, streamKey: inputEvent.target.value })} />
          </Field>
          <Field label="URL Replay">
            <TextInput value={event.youtube.url} onChange={(inputEvent) => update("youtube", { ...event.youtube, url: inputEvent.target.value })} />
          </Field>
        </div>
      </section>
    </div>
  );
}
