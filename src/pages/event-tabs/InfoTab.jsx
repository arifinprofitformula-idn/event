import React from "react";
import { EVENT_STATUS, PLATFORMS, TYPES } from "../../model.js";
import { Field, SelectInput, TextInput } from "../../components/ui.jsx";

export function InfoTab({ event, update, settings }) {
  return (
    <div className="form-grid">
      <Field label="Nama Event">
        <TextInput value={event.name} onChange={(inputEvent) => update("name", inputEvent.target.value)} />
      </Field>
      <Field label="Tanggal & Waktu">
        <TextInput type="datetime-local" value={event.date} onChange={(inputEvent) => update("date", inputEvent.target.value)} />
      </Field>
      <Field label="Brand">
        <SelectInput value={event.brand} onChange={(inputEvent) => update("brand", inputEvent.target.value)}>
          {settings.brands.map((brand) => <option key={brand}>{brand}</option>)}
        </SelectInput>
      </Field>
      <Field label="Status">
        <SelectInput value={event.status} onChange={(inputEvent) => update("status", inputEvent.target.value)}>
          {EVENT_STATUS.map((status) => <option key={status}>{status}</option>)}
        </SelectInput>
      </Field>
      <Field label="Tipe Event">
        <SelectInput value={event.type} onChange={(inputEvent) => update("type", inputEvent.target.value)}>
          {TYPES.map((type) => <option key={type}>{type}</option>)}
        </SelectInput>
      </Field>
      <Field label="Platform">
        <SelectInput value={event.platform} onChange={(inputEvent) => update("platform", inputEvent.target.value)}>
          {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
        </SelectInput>
      </Field>
      <Field label="PIC Marcom">
        <TextInput value={event.pic} onChange={(inputEvent) => update("pic", inputEvent.target.value)} list="members" />
      </Field>
      <Field label="Pemateri">
        <TextInput value={event.speaker} onChange={(inputEvent) => update("speaker", inputEvent.target.value)} list="members" />
      </Field>
      <Field label="MC">
        <TextInput value={event.mc} onChange={(inputEvent) => update("mc", inputEvent.target.value)} list="members" />
      </Field>
      <Field label="Operator">
        <TextInput value={event.operator} onChange={(inputEvent) => update("operator", inputEvent.target.value)} list="members" />
      </Field>
      <Field label="Target Registran">
        <TextInput value={event.targetRegistrants} onChange={(inputEvent) => update("targetRegistrants", inputEvent.target.value)} />
      </Field>
      <datalist id="members">
        {settings.members.map((member) => <option key={member} value={member} />)}
      </datalist>
    </div>
  );
}
