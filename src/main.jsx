import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AnalyticsPanel } from "./components/AnalyticsPanel.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { UserBadge } from "./components/UserBadge.jsx";
import { createEvent, DEFAULT_SETTINGS } from "./model.js";
import { Dashboard } from "./pages/Dashboard.jsx";
import { EventDetail } from "./pages/EventDetail.jsx";
import { Login } from "./pages/Login.jsx";
import { Settings } from "./pages/Settings.jsx";
import { authApi } from "./services/authService.js";
import { createEventService, eventRepository, settingsRepository } from "./services/eventService.js";
import { useRepositoryStore } from "./storage.js";
import { computeAnalytics, csvForEvents, downloadText } from "./utils.js";

const eventService = createEventService(eventRepository);

function App() {
  const [events, setEvents] = useRepositoryStore(eventRepository);
  const [settings, setSettings] = useRepositoryStore(settingsRepository);
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeEvent, setActiveEvent] = useState(null);
  const [filters, setFilters] = useState({ q: "", brand: "Semua", status: "Semua" });
  const safeEvents = Array.isArray(events) ? events.filter((event) => event && typeof event === "object") : [];
  const safeUsers = Array.isArray(users) && users.length ? users : [];
  const safeSettings = {
    ...DEFAULT_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
    members: Array.isArray(settings?.members) ? settings.members : DEFAULT_SETTINGS.members,
    brands: Array.isArray(settings?.brands) ? settings.brands : DEFAULT_SETTINGS.brands,
    ytChannels: settings?.ytChannels && typeof settings.ytChannels === "object" ? settings.ytChannels : DEFAULT_SETTINGS.ytChannels
  };

  const filteredEvents = useMemo(() => safeEvents.filter((event) => {
    const query = filters.q.trim().toLowerCase();
    const matchesQuery = !query || [event.name, event.speaker, event.pic].some((value) => (
      String(value || "").toLowerCase().includes(query)
    ));
    const matchesBrand = filters.brand === "Semua" || event.brand === filters.brand;
    const matchesStatus = filters.status === "Semua" || event.status === filters.status;
    return matchesQuery && matchesBrand && matchesStatus;
  }), [safeEvents, filters]);

  const analytics = useMemo(() => computeAnalytics(safeEvents), [safeEvents]);

  const reloadWorkspaceData = async () => {
    const [nextEvents, nextSettings] = await Promise.all([
      eventRepository.load(),
      settingsRepository.load()
    ]);
    setEvents(nextEvents);
    setSettings(nextSettings);
  };

  useEffect(() => {
    let alive = true;
    authApi.getSession()
      .then(({ session: nextSession }) => {
        if (alive) setSession(nextSession);
        if (alive && nextSession) reloadWorkspaceData().catch(() => {});
      })
      .catch(() => {
        if (alive) setSession(null);
      })
      .finally(() => {
        if (alive) setAuthLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadUsers = async () => {
    if (session?.role !== "admin") return;
    const result = await authApi.listUsers();
    setUsers(result.users || []);
  };

  const handleLogin = async (email, password) => {
    try {
      const result = await authApi.login(email, password);
      setSession(result.session);
      await reloadWorkspaceData();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    setSession(null);
    setUsers([]);
    setActiveEvent(null);
    setView("dashboard");
  };

  const createUser = async (user) => {
    await authApi.createUser(user);
    await loadUsers();
  };

  const updateUser = async (id, patch) => {
    await authApi.updateUser(id, patch);
    await loadUsers();
  };

  const deleteUser = async (id) => {
    await authApi.deleteUser(id);
    await loadUsers();
  };

  const openNewEvent = () => {
    setActiveEvent(createEvent(safeSettings));
    setView("detail");
  };

  const openEvent = (event) => {
    setActiveEvent(structuredClone(event));
    setView("detail");
  };

  const saveEvent = async (event) => {
    const { nextEvent, nextEvents } = await eventService.upsertEvent(safeEvents, event);
    setEvents(nextEvents);
    setActiveEvent(nextEvent);
    setView("dashboard");
  };

  const deleteEvent = async () => {
    if (!activeEvent || !confirm("Hapus event ini?")) return;
    setEvents(await eventService.deleteEvent(safeEvents, activeEvent.id));
    setView("dashboard");
  };

  if (authLoading) {
    return (
      <main className="login-screen">
        <div className="login-panel">
          <h1>Event Manager</h1>
          <p>Memeriksa session...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (view === "settings") {
    return (
      <Settings
        settings={settings}
        setSettings={setSettings}
        users={safeUsers}
        loadUsers={loadUsers}
        createUser={createUser}
        updateUser={updateUser}
        deleteUser={deleteUser}
        session={session}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "detail" && activeEvent) {
    return (
      <EventDetail
        event={activeEvent}
        setEvent={setActiveEvent}
        settings={safeSettings}
        onBack={() => setView("dashboard")}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    );
  }

  return (
    <>
      <Dashboard
        events={filteredEvents}
        allEvents={safeEvents}
        filters={filters}
        setFilters={setFilters}
        onOpen={openEvent}
        onNew={openNewEvent}
        onExport={() => downloadText("events.csv", csvForEvents(safeEvents))}
        analytics={analytics}
      />
      <UserBadge session={session} onLogout={handleLogout} />
      <div className="floating-actions">
        <button className="button secondary" onClick={() => setView("settings")}>Pengaturan</button>
      </div>
      <AnalyticsPanel analytics={analytics} />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
