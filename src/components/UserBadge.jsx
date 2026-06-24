import React from "react";

export function UserBadge({ session, onLogout, compact = false }) {
  return (
    <div className={`user-badge ${compact ? "compact" : ""}`}>
      <div>
        <strong>{session.name}</strong>
        <span>{session.role}</span>
      </div>
      <button className="button secondary" onClick={onLogout}>Keluar</button>
    </div>
  );
}
