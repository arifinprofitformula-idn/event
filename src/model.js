export const DEFAULT_SETTINGS = {
  members: ["Coach Arifin", "Marcom Lead", "Marcom Content", "Marcom Ops", "Operator Zoom", "Product Team"],
  brands: ["EPIC Hub", "GOLDGRAM", "MEEZAN GOLD", "SILVERGRAM"],
  ytChannels: {
    "EPIC Hub": "",
    GOLDGRAM: "",
    "MEEZAN GOLD": "",
    SILVERGRAM: ""
  }
};

export const PLATFORMS = ["Zoom Webinar", "Zoom Meeting", "Offline", "Hybrid"];
export const TYPES = ["Free Webinar", "Paid Webinar", "Workshop", "Seminar", "Offline Event", "Lainnya"];
export const STATUS_OPTIONS = ["Belum", "Partial", "Selesai", "Gagal"];
export const EVENT_STATUS = ["Direncanakan", "Berlangsung", "Selesai", "Dibatalkan"];

export const CHECKLIST_TEMPLATE = {
  "H-14 Perencanaan Awal": [
    ["Tema dan judul event dikonfirmasi", "Marcom Lead"],
    ["Speaker / pemateri dikonfirmasi dan setuju", "Marcom Lead"],
    ["Platform dan kapasitas dikonfirmasi", "Marcom Ops"],
    ["Anggaran event disetujui", "Marcom Lead"],
    ["Tim dibagi: Marketing, Content, Ops, MC, Operator", "Marcom Lead"],
    ["Tanggal promosi dan jadwal konten ditetapkan", "Marcom Content"]
  ],
  "H-7 Persiapan Konten & Produk": [
    ["Brief pemateri selesai dibuat dan dikirim", "Marcom Content"],
    ["Brief MC selesai dibuat dan dikirim", "Marcom Content"],
    ["SOP operator Zoom dibagikan ke operator", "Marcom Ops"],
    ["Landing page selesai dan final checked", "Marcom Ops"],
    ["Link registrasi aktif dan diuji", "Marcom Ops"],
    ["Materi promosi selesai dibuat", "Marcom Content"],
    ["Link bonus peserta disiapkan dan diuji", "Product Team"]
  ],
  "H-3 Final Preparation": [
    ["Semua aset tersedia di folder terpusat", "Marcom Ops"],
    ["Test akses Zoom dilakukan", "Operator Zoom"],
    ["Reminder pertama dikirim ke registran", "Marcom Content"],
    ["Rundown acara selesai dan dibagikan", "Marcom Lead"],
    ["Host / MC dikonfirmasi", "MC"],
    ["Q&A handling plan siap", "Marcom Content"]
  ],
  "H-1 Hari Sebelum Event": [
    ["Reminder kedua dikirim", "Marcom Content"],
    ["Akses Zoom pemateri dan MC dikonfirmasi", "Operator Zoom"],
    ["Slide pemateri diterima dan dicek", "Operator Zoom"],
    ["Link bonus aktif", "Product Team"],
    ["Zoom room dan YouTube Live diuji ulang", "Operator Zoom"]
  ],
  "H-0 Pelaksanaan": [
    ["Zoom room dibuka 30 menit sebelum mulai", "Operator Zoom"],
    ["Recording dan livestream diaktifkan", "Operator Zoom"],
    ["Waiting room dikelola", "Operator Zoom"],
    ["Chat moderasi aktif", "Marcom Content"],
    ["Link bonus dibagikan", "Operator Zoom"],
    ["MC membuka acara sesuai brief", "MC"],
    ["Dokumentasi diambil", "Marcom Content"],
    ["CTA produk disampaikan", "MC"]
  ],
  "Pasca Event Follow Up": [
    ["Rekaman diunduh dan disimpan", "Operator Zoom"],
    ["Video YouTube diperiksa", "Marcom Content"],
    ["Terima kasih dikirim ke peserta", "Marcom Content"],
    ["Data registran dan attendee diexport", "Marcom Ops"],
    ["Link replay dikirim", "Marcom Content"],
    ["Laporan evaluasi event disusun", "Marcom Lead"],
    ["Insight dan pembelajaran didokumentasikan", "Marcom Lead"]
  ]
};

export const SCORECARD_TEMPLATE = [
  ["registrants", "Jumlah Registran", "150"],
  ["attendance", "Attendance Rate (%)", "70%"],
  ["engagement", "Engagement Peserta", "Tinggi"],
  ["bonus", "Link Bonus Siap H-3", "Ya"],
  ["landing_page", "LP Final Check Selesai", "Ya"],
  ["speaker_brief", "Brief Pemateri Dikirim H-3", "Ya"],
  ["checklist", "Checklist Event Tersedia", "Ya"],
  ["operator", "Operator Zoom Siap", "Ya"],
  ["youtube_live", "YouTube Live Stream Aktif", "Ya"],
  ["youtube_upload", "Video YouTube Dipublikasi", "Ya"]
];

const makeChecklist = () => Object.fromEntries(
  Object.entries(CHECKLIST_TEMPLATE).map(([phase, items]) => [
    phase,
    items.map(([title, pic]) => ({ title, pic, status: "Belum", deadline: "", note: "" }))
  ])
);

export const createEvent = (settings) => ({
  id: crypto.randomUUID(),
  name: "",
  date: "",
  brand: settings.brands[0] || "EPIC Hub",
  status: "Direncanakan",
  type: "Free Webinar",
  platform: "Zoom Webinar",
  pic: "",
  speaker: "",
  mc: "",
  operator: "",
  targetRegistrants: "150",
  zoom: { id: "", password: "", link: "" },
  youtube: { title: "", streamKey: "", url: "" },
  checklist: makeChecklist(),
  scorecard: SCORECARD_TEMPLATE.map(([key, label, target]) => ({ key, label, target, actual: "", status: "Belum" })),
  findings: [],
  recommendations: [],
  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
