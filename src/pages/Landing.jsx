import React from "react";

const modules = [
  ["01", "Info & Arsip Event", "Data master event, tim, target, status, dan riwayat tersimpan rapi."],
  ["02", "Streaming & Zoom", "Kelola Zoom, YouTube Live, stream key, dan link replay per brand."],
  ["03", "Checklist Persiapan", "Checklist H-14 hingga pasca event dengan PIC, status, dan deadline."],
  ["04", "Scorecard Evaluasi", "Target vs realisasi dihitung menjadi skor performa event yang objektif."],
  ["05", "Temuan & Follow-up", "Catat masalah, dampak, rekomendasi, PIC, dan status tindak lanjut."]
];

const flows = [
  ["01", "Rencanakan", "Buat event, tentukan brand, platform, tim, target, dan jadwal."],
  ["02", "Eksekusi", "Pantau checklist, streaming, MC, operator, dan aset event."],
  ["03", "Evaluasi", "Ukur scorecard, catat temuan, dan susun rekomendasi follow-up."]
];

export function Landing({ onLogin }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Event Manager">
          <img src="/epi-logo.png" alt="EPI Indonesia Bullion Ecosystem" />
          <span>Event Manager</span>
        </a>
        <div className="landing-links">
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#fitur">Fitur</a>
          <a href="#modul">Modul</a>
          <button className="button secondary" onClick={onLogin}>Login</button>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-badge"><span></span> PT. Emas Perak Indonesia · Marcom Division</div>
        <h1>Satu Sistem. Semua Event Terkendali.</h1>
        <p>Platform manajemen event digital untuk Indonesian Bullion Ecosystem, dari perencanaan, checklist, streaming, scorecard, hingga follow-up evaluasi.</p>
        <div className="landing-actions">
          <button className="button primary" onClick={onLogin}>Akses Dashboard</button>
          <a className="button secondary" href="#cara-kerja">Lihat Cara Kerja</a>
        </div>
        <div className="landing-metrics">
          <div><strong>5</strong><span>Modul Operasional</span></div>
          <div><strong>40+</strong><span>Checklist Item</span></div>
          <div><strong>100</strong><span>Scorecard Maksimal</span></div>
          <div><strong>∞</strong><span>Arsip Event</span></div>
        </div>
      </section>

      <section className="landing-strip" aria-label="Fitur singkat">
        {["Input & Arsip Event", "Checklist H-14 - Pasca Event", "Scorecard Otomatis", "YouTube Live", "Follow-up Evaluasi"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="landing-section" id="cara-kerja">
        <div className="landing-section-head">
          <span className="eyebrow">Cara Kerja</span>
          <h2>Operasional event yang bergerak dari rencana ke insight.</h2>
          <p>Sistem dirancang untuk membuat tim marcom lebih disiplin, cepat, dan terukur pada setiap fase event.</p>
        </div>
        <div className="landing-flow">
          {flows.map(([num, title, text]) => (
            <article key={num}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-feature" id="fitur">
        <div>
          <span className="eyebrow">Fitur Unggulan</span>
          <h2>Dibangun untuk kecepatan dan presisi tim.</h2>
          <p>Dashboard menyatukan event aktif, status checklist, scorecard, analisa risiko, dan follow-up terbuka dalam satu workspace yang mudah dipantau.</p>
          <button className="button primary" onClick={onLogin}>Masuk ke Workspace</button>
        </div>
        <div className="landing-preview">
          <div className="preview-top">
            <span>Event Operations Center</span>
            <strong>Avg. Score 86%</strong>
          </div>
          <div className="preview-bars">
            <span style={{ width: "82%" }}></span>
            <span style={{ width: "64%" }}></span>
            <span style={{ width: "92%" }}></span>
          </div>
          <div className="preview-grid">
            <div>Total Event<strong>24</strong></div>
            <div>Selesai<strong>18</strong></div>
            <div>Follow-up<strong>6</strong></div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="modul">
        <div className="landing-section-head">
          <span className="eyebrow">Modul Sistem</span>
          <h2>Setiap aspek event punya tempatnya.</h2>
          <p>Modul dibuat mengikuti kebutuhan operasional event digital dan offline tim EPI.</p>
        </div>
        <div className="landing-modules">
          {modules.map(([num, title, text]) => (
            <article key={num}>
              <span>MODUL {num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <span className="eyebrow">Siap Digunakan</span>
        <h2>Mulai kelola event dengan lebih rapi.</h2>
        <p>Buka dashboard untuk membuat event pertama, mengatur checklist, dan memantau evaluasi tim.</p>
        <button className="button primary" onClick={onLogin}>Login ke Dashboard</button>
      </section>

      <footer className="landing-footer">
        <span>© 2026 Indonesian Bullion Ecosystem · Event Manager</span>
        <a href="https://arvadigital.web.id/" target="_blank" rel="noreferrer">Made with love ♥ by Arva Digital Media</a>
      </footer>
    </main>
  );
}
