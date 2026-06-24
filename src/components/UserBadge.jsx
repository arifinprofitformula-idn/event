import React from "react";

export function UserBadge({ session, onLogout }) {
  return (
    <div className="user-badge">
      <div>
        <strong>{session.name}</strong>
        <span>{session.role}</span>
      </div>
      <button className="button secondary" onClick={onLogout}>Keluar</button>
    </div>
  );
}
