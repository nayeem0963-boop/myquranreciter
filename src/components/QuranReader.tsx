import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Ayah, Bookmark, Surah } from "../types";
import type { ReadingTheme } from "../hooks/useReadingPreferences";
import { PauseIcon, PlayIcon, StarIcon } from "./Icons";
import { haptic } from "../utils/haptics";
import TafsirDrawer from "./TafsirDrawer";

interface QuranReaderProps {
  surah?: Surah;
  verses: Ayah[];
  activeVerseIndex: number;
  isPlaying: boolean;
  onPlayVerse: (ayahIndex: number) => void;
  onPlaySurah: () => void;
  isLoading: boolean;
  arabicFontSize: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  theme: ReadingTheme;
  bookmarks: Bookmark[];
  onToggleBookmark: (verse: Ayah) => void;
  isLoadingWords: boolean;
  wordDataNotice: string;
}

export default function QuranReader({
  surah,
  verses,
  activeVerseIndex,
  isPlaying,
  onPlayVerse,
  onPlaySurah,
  isLoading,
  arabicFontSize,
  showTranslation,
  showTransliteration,
  theme,
  bookmarks,
  onToggleBookmark,
  isLoadingWords,
  wordDataNotice,
}: QuranReaderProps) {
  const activeVerseRef = useRef<HTMLDivElement>(null);
  const [tafsirVerse, setTafsirVerse] = useState<Ayah | null>(null);
  const [activeWordKey, setActiveWordKey] = useState<string | null>(null);
  const closeTafsir = useCallback(() => setTafsirVerse(null), []);
  const bookmarkKeys = useMemo(
    () => new Set(bookmarks.map((bookmark) => `${bookmark.surahId}:${bookmark.verseNumber}`)),
    [bookmarks],
  );

  useEffect(() => {
    if (isPlaying) activeVerseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeVerseIndex, isPlaying]);

  if (!surah) return null;

  return (
    <>
    <section className={`reader-panel panel reading-theme-${theme}`} aria-labelledby="reader-title">
      <div className="reader-topline">
        <span className="eyebrow">THE HOLY QURAN</span>
        <span className="revelation-tag">{surah.revelationType} · {surah.numberOfAyahs} verses</span>
      </div>
      <div className="surah-cover">
        <div className="cover-titles">
          <h1 id="reader-title">{surah.nameTransliteration}</h1>
          <p className="cover-meaning">{surah.nameEnglish}</p>
        </div>
        <p className="cover-arabic" lang="ar" dir="rtl">{surah.nameArabic}</p>
        <button className="listen-surah-button" type="button" onClick={onPlaySurah}>
          <PlayIcon size={16} /> Listen
        </button>
      </div>
      {surah.number !== 1 && surah.number !== 9 && (
        <p className="bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
      )}
      <div className="verse-list" role="list" aria-label={`${surah.nameTransliteration} verses`}>
        {isLoading && verses.length === 0 ? (
          <div className="verse-skeletons" role="status" aria-label="Loading verses">
            {[0, 1, 2].map((item) => (
              <div className="verse-skeleton" key={item} aria-hidden="true">
                <span className="skeleton skeleton-badge" />
                <span className="skeleton skeleton-line wide" />
                <span className="skeleton skeleton-line" />
              </div>
            ))}
          </div>
        ) : verses.length === 0 ? (
          <p className="loading-state" role="status">Verses are unavailable offline. Connect to the internet to load this Surah.</p>
        ) : verses.map((verse, index) => (
          <div
            className={`verse-card-row${activeVerseIndex === index ? " active" : ""}`}
            key={`${surah.number}:${verse.numberInSurah}`}
            role="listitem"
            ref={activeVerseIndex === index ? activeVerseRef : undefined}
          >
            <div className="verse-toolbar">
              <button
                className="verse-marker"
                type="button"
                onClick={() => onPlayVerse(index)}
                aria-label={`Play verse ${verse.numberInSurah}`}
                aria-current={activeVerseIndex === index ? "true" : undefined}
              >{verse.numberInSurah}</button>
              <div className="verse-actions">
                <button
                  className={`verse-play${activeVerseIndex === index && isPlaying ? " playing" : ""}`}
                  type="button"
                  aria-label={activeVerseIndex === index && isPlaying ? "Currently playing" : `Play verse ${verse.numberInSurah}`}
                  onClick={() => onPlayVerse(index)}
                >
                  {activeVerseIndex === index && isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                </button>
                <button
                  className={`bookmark-toggle${bookmarkKeys.has(`${surah.number}:${verse.numberInSurah}`) ? " bookmarked" : ""}`}
                  type="button"
                  aria-label={bookmarkKeys.has(`${surah.number}:${verse.numberInSurah}`)
                    ? `Remove bookmark for verse ${verse.numberInSurah}`
                    : `Bookmark verse ${verse.numberInSurah}`}
                  aria-pressed={bookmarkKeys.has(`${surah.number}:${verse.numberInSurah}`)}
                  onClick={() => {
                    haptic(12);
                    onToggleBookmark(verse);
                  }}
                ><StarIcon size={22} active={bookmarkKeys.has(`${surah.number}:${verse.numberInSurah}`)} /></button>
                <button
                  className="tafsir-trigger"
                  type="button"
                  aria-label={`Read Tafsir for verse ${verse.numberInSurah}`}
                  onClick={() => setTafsirVerse(verse)}
                >Tafsir</button>
              </div>
            </div>
            <div
              className="verse-content"
              style={{ "--arabic-font-size": `${arabicFontSize}px` } as CSSProperties}
              onClick={() => onPlayVerse(index)}
            >
              <span className="verse-arabic" lang="ar" dir="rtl">
                {verse.words && verse.words.length > 0 ? (
                  <span className="word-by-word">
                    {verse.words.map((word) => {
                      const wordKey = `${surah.number}:${verse.numberInSurah}:${word.position}`;
                      const glossId = `word-gloss-${surah.number}-${verse.numberInSurah}-${word.position}`;
                      const isWordActive = activeWordKey === wordKey;
                      return (
                        <span
                          className="word-token-wrap"
                          key={wordKey}
                          onMouseEnter={() => setActiveWordKey(wordKey)}
                          onMouseLeave={() => setActiveWordKey((current) => current === wordKey ? null : current)}
                        >
                          <button
                            className="word-token"
                            type="button"
                            aria-label={`${word.text}${word.transliteration ? `, ${word.transliteration}` : ""}${word.translation ? `, ${word.translation}` : ""}`}
                            aria-describedby={isWordActive ? glossId : undefined}
                            aria-expanded={isWordActive}
                            onFocus={() => setActiveWordKey(wordKey)}
                            onBlur={() => setActiveWordKey((current) => current === wordKey ? null : current)}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveWordKey(wordKey);
                            }}
                          >{word.text}</button>
                          {isWordActive && (
                            <span className="word-gloss" id={glossId} role="tooltip">
                              {word.transliteration && <span>{word.transliteration}</span>}
                              {word.translation && <span>{word.translation}</span>}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </span>
                ) : verse.text}
              </span>
              {showTransliteration && verse.transliteration && (
                <span className="verse-transliteration" lang="en" dir="ltr">{verse.transliteration}</span>
              )}
              {showTranslation && (
                <span className="verse-translation" lang="en" dir="ltr">{verse.translation}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isLoadingWords && <p className="word-data-notice" role="status">Loading word-by-word information…</p>}
      {wordDataNotice && <p className="word-data-notice" role="status">{wordDataNotice}</p>}
    </section>
    {tafsirVerse && surah && (
      <TafsirDrawer surah={surah} verse={tafsirVerse} onClose={closeTafsir} />
    )}
    </>
  );
}
