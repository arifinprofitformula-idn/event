import React from "react";
import { useEffect, useState } from "react";
import { Field, SelectInput, TextInput } from "../components/ui.jsx";

export function Settings({ settings, setSettings, users, loadUsers, createUser, updateUser, deleteUser, session, onBack }) {
  const [member, setMember] = useState("");
  const [brand, setBrand] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "member" });
  const [userError, setUserError] = useState("");
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (isAdmin) loadUsers().catch((error) => setUserError(error.message));
  }, [isAdmin]);

  const addMember = () => {
    if (!member.trim()) return;
    setSettings({ ...settings, members: [...settings.members, member.trim()] });
    setMember("");
  };

  const addUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return;
    try {
      setUserError("");
      await createUser(newUser);
      setNewUser({ name: "", email: "", password: "", role: "member" });
    } catch (error) {
      setUserError(error.message);
    }
  };

  const addBrand = () => {
    if (!brand.trim()) return;
    setSettings({
      ...settings,
      brands: [...settings.brands, brand.trim()],
      ytChannels: { ...settings.ytChannels, [brand.trim()]: "" }
    });
    setBrand("");
  };

  return (
    <main className="screen narrow">
      <section className="detail-top">
        <button className="button secondary" onClick={onBack}>Kembali</button>
        <div>
          <h1>Pengaturan</h1>
          <p>Master data tim, brand, dan channel.</p>
        </div>
      </section>

      <section className="panel stack">
        <div className="section-title"><h2>Anggota Tim</h2></div>
        <div className="tag-list">
          {settings.members.map((item) => (
            <button
              className="tag"
              key={item}
              onClick={() => setSettings({ ...settings, members: settings.members.filter((memberName) => memberName !== item) })}
            >
              {item} x
            </button>
          ))}
        </div>
        <div className="inline-form">
          <TextInput value={member} onChange={(event) => setMember(event.target.value)} placeholder="Nama anggota" />
          <button className="button primary" onClick={addMember}>Tambah</button>
        </div>

        <div className="section-title"><h2>Brand & YouTube</h2></div>
        {settings.brands.map((item) => (
          <div className="brand-row" key={item}>
            <strong>{item}</strong>
            <TextInput
              value={settings.ytChannels[item] || ""}
              onChange={(event) => setSettings({
                ...settings,
                ytChannels: { ...settings.ytChannels, [item]: event.target.value }
              })}
              placeholder="URL channel YouTube"
            />
          </div>
        ))}
        <div className="inline-form">
          <TextInput value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Nama brand" />
          <button className="button primary" onClick={addBrand}>Tambah</button>
        </div>
      </section>

      {isAdmin && (
        <section className="panel stack">
          <div className="section-title">
            <h2>Manajemen User</h2>
            <span>Admin only</span>
          </div>
          {userError && <div className="alert error">{userError}</div>}

          <div className="user-table">
            {users.map((user) => (
              <div className="user-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <SelectInput value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value }).catch((error) => setUserError(error.message))}>
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </SelectInput>
                <SelectInput value={user.active ? "active" : "inactive"} onChange={(event) => updateUser(user.id, { active: event.target.value === "active" }).catch((error) => setUserError(error.message))}>
                  <option value="active">aktif</option>
                  <option value="inactive">nonaktif</option>
                </SelectInput>
                <button className="button danger" disabled={user.id === session.id} onClick={() => deleteUser(user.id).catch((error) => setUserError(error.message))}>Hapus</button>
              </div>
            ))}
          </div>

          <div className="form-grid">
            <Field label="Nama">
              <TextInput value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <TextInput value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} type="email" />
            </Field>
            <Field label="Password">
              <TextInput value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} type="password" />
            </Field>
            <Field label="Role">
              <SelectInput value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </SelectInput>
            </Field>
          </div>
          <button className="button primary" onClick={addUser}>Tambah User</button>
        </section>
      )}
    </main>
  );
}
