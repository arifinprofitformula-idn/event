const normalizeStatus = (status) => {
  if (!status) return "Belum";
  if (String(status).includes("Selesai")) return "Selesai";
  if (String(status).includes("Partial")) return "Partial";
  if (String(status).includes("Gagal")) return "Gagal";
  return status;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

export const computeScore = (scorecard) => {
  const items = asArray(scorecard);
  if (!items.length) return 0;
  const points = items.reduce((sum, item) => {
    const status = normalizeStatus(item?.status);
    if (status === "Selesai") return sum + 1;
    if (status === "Partial") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / items.length) * 100);
};

export const computeChecklistProgress = (checklist) => {
  const items = Object.values(checklist || {}).flat();
  if (!items.length) return 0;
  return Math.round((items.filter((item) => normalizeStatus(item?.status) === "Selesai").length / items.length) * 100);
};

const groupCount = (events, field) => Object.entries(events.reduce((groups, event) => {
  const key = event[field] || "Tidak diset";
  groups[key] = (groups[key] || 0) + 1;
  return groups;
}, {}))
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

const getEventRisk = (event) => {
  const score = computeScore(event.scorecard);
  const checklist = computeChecklistProgress(event.checklist);
  const openFollowUps = (event.recommendations || []).filter((rec) => normalizeStatus(rec.status) !== "Selesai").length;

  let level = "Rendah";
  const reasons = [];

  if (score < 70) reasons.push("score di bawah 70%");
  if (checklist < 80 && event.status !== "Selesai") reasons.push("checklist di bawah 80%");
  if (openFollowUps > 0) reasons.push(`${openFollowUps} follow-up terbuka`);
  if (event.status === "Dibatalkan") reasons.push("event dibatalkan");

  if (score < 50 || checklist < 50 || event.status === "Dibatalkan") level = "Tinggi";
  else if (reasons.length) level = "Sedang";

  return { score, checklist, openFollowUps, level, reasons };
};

export const computeAnalytics = (events) => {
  const safeEvents = Array.isArray(events) ? events.filter((event) => event && typeof event === "object") : [];
  const total = safeEvents.length;
  const done = safeEvents.filter((event) => event.status === "Selesai").length;
  const avgScore = total ? Math.round(safeEvents.reduce((sum, event) => sum + computeScore(event.scorecard), 0) / total) : 0;
  const avgChecklist = total ? Math.round(safeEvents.reduce((sum, event) => sum + computeChecklistProgress(event.checklist), 0) / total) : 0;
  const pendingFollowUps = safeEvents.reduce((sum, event) => sum + (event.recommendations || []).filter((rec) => normalizeStatus(rec.status) !== "Selesai").length, 0);
  const weakEvents = safeEvents.filter((event) => computeScore(event.scorecard) < 70 && event.status === "Selesai").length;
  const incompletePreparation = safeEvents.filter((event) => computeChecklistProgress(event.checklist) < 80 && event.status !== "Selesai").length;
  const byBrand = groupCount(safeEvents, "brand");
  const byStatus = groupCount(safeEvents, "status");
  const byPlatform = groupCount(safeEvents, "platform");
  const riskEvents = safeEvents
    .map((event) => ({ event, risk: getEventRisk(event) }))
    .filter(({ risk }) => risk.level !== "Rendah")
    .sort((a, b) => {
      const weight = { Tinggi: 2, Sedang: 1, Rendah: 0 };
      return weight[b.risk.level] - weight[a.risk.level] || a.risk.score - b.risk.score;
    })
    .slice(0, 5);
  const openRecommendations = safeEvents.flatMap((event) => (
    (event.recommendations || [])
      .filter((rec) => normalizeStatus(rec.status) !== "Selesai")
      .map((rec) => ({ ...rec, eventId: event.id, eventName: event.name || "Untitled Event", brand: event.brand }))
  )).slice(0, 6);

  const insights = [
    total ? `${done} dari ${total} event sudah selesai.` : "Belum ada data event untuk dianalisa.",
    avgScore >= 80 ? "Rata-rata score event sehat." : "Rata-rata score masih perlu ditingkatkan.",
    avgChecklist >= 80 ? "Rata-rata checklist sudah terkendali." : "Rata-rata checklist masih perlu dipercepat.",
    pendingFollowUps ? `${pendingFollowUps} rekomendasi tindak lanjut belum selesai.` : "Tidak ada follow-up tertunda.",
    weakEvents ? `${weakEvents} event selesai memiliki score di bawah 70%.` : "Tidak ada event selesai dengan score kritis.",
    incompletePreparation ? `${incompletePreparation} event aktif memiliki checklist di bawah 80%.` : "Persiapan event aktif relatif terkendali."
  ];
  return {
    total,
    done,
    avgScore,
    avgChecklist,
    pendingFollowUps,
    byBrand,
    byStatus,
    byPlatform,
    riskEvents,
    openRecommendations,
    insights
  };
};

export const csvForEvents = (events) => {
  const safeEvents = Array.isArray(events) ? events.filter((event) => event && typeof event === "object") : [];
  const rows = [["Nama", "Tanggal", "Brand", "Status", "PIC", "Speaker", "Checklist", "Score"]];
  safeEvents.forEach((event) => rows.push([
    event.name,
    event.date,
    event.brand,
    event.status,
    event.pic,
    event.speaker,
    `${computeChecklistProgress(event.checklist)}%`,
    `${computeScore(event.scorecard)}%`
  ]));
  return rows.map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(",")).join("\n");
};

export const downloadText = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const printReport = () => window.print();
