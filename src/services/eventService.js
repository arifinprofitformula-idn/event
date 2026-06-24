import { DEFAULT_SETTINGS } from "../model.js";
import { createHttpRepository } from "./httpRepository.js";

export const eventRepository = createHttpRepository({
  resource: "/api/events",
  responseKey: "events",
  fallbackValue: []
});

export const settingsRepository = createHttpRepository({
  resource: "/api/settings",
  responseKey: "settings",
  fallbackValue: DEFAULT_SETTINGS
});

export const createEventService = (repository = eventRepository) => ({
  loadEvents() {
    return repository.load();
  },
  saveEvents(events) {
    return repository.save(events);
  },
  async upsertEvent(events, event) {
    const nextEvent = { ...event, updatedAt: new Date().toISOString() };
    const nextEvents = events.some((item) => item.id === nextEvent.id)
      ? events.map((item) => item.id === nextEvent.id ? nextEvent : item)
      : [nextEvent, ...events];

    await repository.save(nextEvents);
    return { nextEvent, nextEvents };
  },
  async deleteEvent(events, eventId) {
    const nextEvents = events.filter((event) => event.id !== eventId);
    await repository.save(nextEvents);
    return nextEvents;
  }
});

export const createSettingsService = (repository = settingsRepository) => ({
  loadSettings() {
    return repository.load();
  },
  saveSettings(settings) {
    return repository.save(settings);
  }
});
