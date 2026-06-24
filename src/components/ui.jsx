import React from "react";

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return <input className="input" {...props} />;
}

export function SelectInput(props) {
  return <select className="input" {...props} />;
}

export function TextArea(props) {
  return <textarea className="input textarea" {...props} />;
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function StatCard({ label, value, tone }) {
  return (
    <div className={`stat ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
