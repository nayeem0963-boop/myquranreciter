import { useCallback } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { getReciters } from "../services/quranApi";

interface LandingProps {
  onEnter: (options?: { surahId?: number; library?: boolean }) => void;
  canInstall: boolean;
  onInstall: () => void;
}

const POPULAR_SURAHS = [
  { number: 1, name: "Al-Fatihah", meaning: "The Opening", verses: 7, arabic: "الفاتحة" },
  { number: 36, name: "Yasin", meaning: "Ya-Sin", verses: 83, arabic: "يس" },
  { number: 67, name: "Al-Mulk", meaning: "The Sovereignty", verses: 30, arabic: "الملك" },
  { number: 18, name: "Al-Kahf", meaning: "The Cave", verses: 110, arabic: "الكهف" },
  { number: 55, name: "Ar-Rahman", meaning: "The Beneficent", verses: 78, arabic: "الرحمن" },
  { number: 2, name: "Al-Baqarah", meaning: "The Cow", verses: 286, arabic: "البقرة" },
];

const FEATURES = [
  { icon: "☾", title: "Plays With The Screen Locked", text: "One continuous recording per surah keeps reciting with your phone locked, with lock-screen controls." },
  { icon: "ع", title: "Word-by-Word Meanings", text: "Tap any Arabic word to see its meaning while you follow the recitation verse by verse." },
  { icon: "✦", title: "Bookmarks & Resume", text: "Save favourite verses and pick up exactly where you left off, every time." },
  { icon: "☷", title: "Tafsir & Translation", text: "Read the English meaning and tafsir under each verse, in light, warm or dark reading modes." },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing({ onEnter, canInstall, onInstall }: LandingProps) {
  const { state, setReciter } = useAudioPlayer();
  const reciters = getReciters();
  const listen = useCallback((surahId: number) => onEnter({ surahId }), [onEnter]);

  return (
    <div className="landing" role="region" aria-label="Welcome to My Quran Reciter">
      <header className="landing-header">
        <a className="landing-brand" href="#top" onClick={(event) => { event.preventDefault(); scrollToSection("landing-hero"); }}>
          <span className="landing-brand-mark" aria-hidden="true">✦</span>
          <span>
            <span className="landing-brand-name">myquranreciter</span>
            <span className="landing-brand-tag">Holy Quran Audio</span>
          </span>
        </a>
        <button className="landing-pill" type="button" onClick={() => onEnter({ library: true })}>Browse Surahs</button>
      </header>

      <section className="landing-hero" id="landing-hero">
        <div className="landing-arch" aria-hidden="true">
          <div className="landing-arch-inner">
            <span className="landing-arch-arabic">القرآن الكريم</span>
            <span className="landing-arch-sub">The Noble Quran</span>
            <span className="landing-arch-stars">✦ ✦ ✦</span>
          </div>
        </div>
        <h1>
          Immerse Your Heart in
          <span className="landing-gold"> Divine Quranic Recitation</span>
        </h1>
        <p className="landing-lead">
          Listen to the Quran from renowned reciters, follow every verse as it is recited, and keep listening even with your screen locked.
        </p>
        <div className="landing-cta">
          <button className="landing-btn landing-btn-gold" type="button" onClick={() => listen(1)}>
            <span aria-hidden="true">▶</span> Start Listening
          </button>
          {canInstall && (
            <button className="landing-btn landing-btn-navy" type="button" onClick={onInstall}>
              <span aria-hidden="true">↓</span> Install App
            </button>
          )}
          <button className="landing-btn landing-btn-ghost" type="button" onClick={() => scrollToSection("landing-surahs")}>
            <span aria-hidden="true">☰</span> Explore Surahs
          </button>
        </div>
        <dl className="landing-stats">
          <div><dt>114</dt><dd>Full Surahs</dd></div>
          <div><dt>{reciters.length}</dt><dd>Master Qaris</dd></div>
          <div><dt>Verse by Verse</dt><dd>Follow Along</dd></div>
          <div><dt>Free</dt><dd>No Ads</dd></div>
        </dl>
      </section>

      <section className="landing-section" id="landing-surahs">
        <p className="landing-eyebrow">Quick Selection</p>
        <h2>Popular Surahs</h2>
        <p className="landing-sub">Choose a surah to begin listening right away.</p>
        <div className="landing-surah-grid">
          {POPULAR_SURAHS.map((surah) => (
            <button key={surah.number} className="landing-surah" type="button" onClick={() => listen(surah.number)}>
              <span className="landing-surah-number">{String(surah.number).padStart(2, "0")}</span>
              <span className="landing-surah-text">
                <strong>Surah {surah.name}</strong>
                <small>{surah.meaning} • {surah.verses} Verses</small>
              </span>
              <span className="landing-surah-side">
                <span className="landing-surah-arabic" lang="ar" dir="rtl">{surah.arabic}</span>
                <span className="landing-surah-play" aria-hidden="true">▶</span>
              </span>
            </button>
          ))}
        </div>
        <button className="landing-btn landing-btn-ghost landing-more" type="button" onClick={() => onEnter({ library: true })}>
          Browse all 114 surahs
        </button>
      </section>

      <section className="landing-section landing-section-alt" id="landing-features">
        <p className="landing-eyebrow">Designed For Devotion</p>
        <h2>Key App Features</h2>
        <div className="landing-feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing-feature">
              <span className="landing-feature-icon" aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="landing-reciters">
        <p className="landing-eyebrow">World Renowned Qaris</p>
        <h2>Featured Voice Artists</h2>
        <p className="landing-sub">Pick the voice you want to hear.</p>
        <div className="landing-reciter-grid">
          {reciters.map((reciter) => (
            <button
              key={reciter.id}
              type="button"
              className={`landing-reciter${state.currentReciterId === reciter.id ? " selected" : ""}`}
              aria-pressed={state.currentReciterId === reciter.id}
              onClick={() => setReciter(reciter.id)}
            >
              <span className="landing-reciter-icon" aria-hidden="true">♫</span>
              <strong>{reciter.name}</strong>
              <small>{reciter.country}</small>
              {state.currentReciterId === reciter.id && <em>Selected</em>}
            </button>
          ))}
        </div>
        <button className="landing-btn landing-btn-gold landing-more" type="button" onClick={() => listen(1)}>
          <span aria-hidden="true">▶</span> Start Listening
        </button>
      </section>

      <footer className="landing-footer">
        <span className="landing-brand-name">myquranreciter</span>
        <small>Continuous Charity (Sadaqah Jariyah) Project</small>
        <button className="landing-link" type="button" onClick={() => onEnter()}>Open the app</button>
      </footer>
    </div>
  );
}
