import { useMemo, useState } from "react";
import type { Surah } from "../types";

interface HomeWelcomeProps {
  surahs: Surah[];
  resume: { surahId: number; ayahIndex: number } | null;
  showInstall: boolean;
  onInstall: () => void;
  onResume: () => void;
  onOpenSurah: (surahId: number) => void;
  onPlaySurah: (surahId: number) => void;
}

export default function HomeWelcome({
  surahs, resume, showInstall, onInstall, onResume, onOpenSurah, onPlaySurah,
}: HomeWelcomeProps) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) =>
      String(s.number) === q ||
      s.nameTransliteration.toLowerCase().includes(q) ||
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameArabic.includes(query.trim()));
  }, [query, surahs]);

  const resumeSurah = resume ? surahs.find((s) => s.number === resume.surahId) : undefined;

  return (
    <div className="home-page">
      <header className="home-header">
        <span className="home-logo" aria-hidden="true">★</span>
        <div className="home-title">
          <h1>MYQURANRECITER</h1>
          <p>HOLY QURAN AUDIO</p>
        </div>
        <button className="home-icon-btn" type="button" aria-label="Search Surahs" aria-expanded={searching}
          onClick={() => setSearching((v) => !v)}>⌕</button>
        {showInstall && (
          <button className="home-icon-btn" type="button" aria-label="Install App" onClick={onInstall}>↓</button>
        )}
      </header>

      {searching && (
        <div className="home-search">
          <input type="search" autoFocus placeholder="Search Surah name or number" value={query}
            onChange={(e) => setQuery(e.target.value)} aria-label="Search Surahs" />
        </div>
      )}

      {resume && !query && (
        <button type="button" className="home-resume" onClick={onResume}>
          Resume: {resumeSurah?.nameTransliteration ?? `Surah ${resume.surahId}`} · Verse {resume.ayahIndex + 1}
        </button>
      )}

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
    </div>
  );
}
