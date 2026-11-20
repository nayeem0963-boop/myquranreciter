import { useEffect, useRef } from "react";
import type { Ayah, Surah } from "../types";

interface QuranReaderProps {
  surah?: Surah;
  verses: Ayah[];
  activeVerseIndex: number;
  isPlaying: boolean;
  onPlayVerse: (ayahIndex: number) => void;
  onPlaySurah: () => void;
  isLoading: boolean;
}

export default function QuranReader({
  surah,
  verses,
  activeVerseIndex,
  isPlaying,
  onPlayVerse,
  onPlaySurah,
  isLoading,
}: QuranReaderProps) {
  const activeVerseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isPlaying) activeVerseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeVerseIndex, isPlaying]);

  if (!surah) return null;

  return (
    <section className="reader-panel panel" aria-labelledby="reader-title">
      <div className="reader-topline">
        <span className="eyebrow">THE HOLY QURAN</span>
        <span className="revelation-tag">{surah.revelationType} · {surah.numberOfAyahs} verses</span>
      </div>
      <div className="surah-cover">
        <span className="cover-ornament" aria-hidden="true">۞</span>
        <p className="cover-arabic" lang="ar" dir="rtl">{surah.nameArabic}</p>
        <h1 id="reader-title">{surah.nameTransliteration}</h1>
        <p className="cover-meaning">{surah.nameEnglish}</p>
        <button className="listen-surah-button" type="button" onClick={onPlaySurah}>
          <span aria-hidden="true">▶</span> Listen to this Surah
        </button>
      </div>
      {surah.number !== 1 && surah.number !== 9 && (
        <p className="bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
      )}
      <div className="verse-list" aria-label={`${surah.nameTransliteration} verses`}>
        {isLoading && verses.length === 0 ? (
          <p className="loading-state" role="status">Loading verses…</p>
        ) : verses.length === 0 ? (
          <p className="loading-state" role="status">Verses are unavailable offline. Connect to the internet to load this Surah.</p>
        ) : verses.map((verse, index) => (
          <button
            className={`verse-card${activeVerseIndex === index ? " active" : ""}`}
            key={`${surah.number}:${verse.numberInSurah}`}
            type="button"
            onClick={() => onPlayVerse(index)}
            aria-label={`Play verse ${verse.numberInSurah}`}
            aria-current={activeVerseIndex === index && isPlaying ? "true" : undefined}
            ref={activeVerseIndex === index ? activeVerseRef : undefined}
          >
            <span className="verse-marker">{verse.numberInSurah}</span>
            <span className="verse-content">
              <span className="verse-arabic" lang="ar" dir="rtl">{verse.text}</span>
              <span className="verse-translation" lang="en" dir="ltr">{verse.translation}</span>
            </span>
            <span className="verse-play" aria-hidden="true">
              {activeVerseIndex === index && isPlaying ? "Ⅱ" : "▶"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
