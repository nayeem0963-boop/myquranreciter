import { useMemo, useRef, useState } from "react";
import type { Surah } from "../types";

interface HomeWelcomeProps {
  surahs: Surah[];
  resume: { surahId: number; ayahIndex: number } | null;
  showInstall: boolean;
  onInstall: () => void;
  onResume: () => void;
  onOpenSurah: (surahId: number) => void;
  onPlaySurah: (surahId: number) => void;
  onListen: () => void;
  onRead: () => void;
}

const FEATURED = [36, 67, 18, 55, 2];

export default function HomeWelcome({
  surahs, resume, showInstall, onInstall, onResume, onOpenSurah, onPlaySurah, onListen, onRead,
}: HomeWelcomeProps) {
  const [query, setQuery] = useState("");
  const sectionRef = useRef<HTMLElement>(null);

  const featured = FEATURED.map((n) => surahs.find((s) => s.number === n)).filter((s): s is Surah => Boolean(s));
  const resumeSurah = resume ? surahs.find((s) => s.number === resume.surahId) : undefined;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) =>
      String(s.number) === q ||
      s.nameTransliteration.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameArabic.includes(query.trim()));
  }, [query, surahs]);

  const scrollToList = () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-topbar">
          <span className="home-logo" aria-hidden="true">★</span>
          <div className="home-title">
            <h1 id="home-title">MYQURANRECITER</h1>
            <p>HOLY QURAN AUDIO</p>
          </div>
          {showInstall && (
            <button className="home-icon-btn" type="button" aria-label="Install App" onClick={onInstall}>↓</button>
          )}
        </div>

        <p className="home-bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        <p className="home-lead">Listen, read and reflect on the Quran, one verse at a time.</p>

        <form className="home-search" role="search" onSubmit={(e) => { e.preventDefault(); scrollToList(); }}>
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search Surah name or number" value={query}
            onChange={(e) => setQuery(e.target.value)} aria-label="Search Surahs" />
        </form>

        <div className="home-entries">
          <button type="button" className="home-entry" onClick={onListen}>
            <span className="home-entry-icon" aria-hidden="true">▶</span>
            <strong>Listen</strong>
            <span>{resume ? `Continue ${resumeSurah?.nameTransliteration ?? "listening"}` : "Start with Al-Fatihah"}</span>
          </button>
          <button type="button" className="home-entry" onClick={onRead}>
            <span className="home-entry-icon" aria-hidden="true">❖</span>
            <strong>Read</strong>
            <span>Open the reader</span>
          </button>
        </div>

        {resume && (
          <button type="button" className="home-resume" onClick={onResume}>
            Resume: {resumeSurah?.nameTransliteration ?? `Surah ${resume.surahId}`} · Verse {resume.ayahIndex + 1}
          </button>
        )}

        {featured.length > 0 && (
          <div className="home-featured" aria-label="Featured Surahs">
            {featured.map((s) => (
              <button key={s.number} type="button" className="home-chip" onClick={() => onOpenSurah(s.number)}>
                {s.nameTransliteration}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="home-scroll-cue" onClick={scrollToList} aria-label="Browse all Surahs">
          Browse all Surahs <span aria-hidden="true">⌄</span>
        </button>
      </section>

      <section className="home-list-section" ref={sectionRef} aria-labelledby="home-list-title">
        <div className="home-section-bar">
          <div>
            <p className="home-eyebrow">THE HOLY QURAN</p>
            <h2 id="home-list-title">Surahs</h2>
          </div>
          <div className="home-view-toggle" role="group" aria-label="View">
            <button type="button" className="active" aria-pressed="true">Surah List</button>
            <button type="button" aria-pressed="false" onClick={onRead}>Reader View</button>
          </div>
        </div>

        <ul className="home-cards">
          {visible.map((s) => (
            <li key={s.number}>
              <div className="home-card" role="button" tabIndex={0} onClick={() => onOpenSurah(s.number)}
                onKeyDown={(e) => { if (e.key === "Enter") onOpenSurah(s.number); }}>
                <span className="home-card-num">{String(s.number).padStart(2, "0")}</span>
                <span className="home-card-main">
                  <strong>Surah {s.nameTransliteration}</strong>
                  <span>{s.nameEnglish} • {s.numberOfAyahs} Verses</span>
                </span>
                <span className="home-card-side">
                  <span className="home-card-ar" lang="ar" dir="rtl">{s.nameArabic}</span>
                  <button type="button" className="home-play" aria-label={`Play Surah ${s.nameTransliteration}`}
                    onClick={(e) => { e.stopPropagation(); onPlaySurah(s.number); }}>▶</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="home-empty">No Surah matches your search.</p>}
      </section>
    </div>
  );
}
