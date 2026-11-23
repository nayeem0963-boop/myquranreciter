import type { Bookmark, Surah } from "../types";

interface HomeWelcomeProps {
  surahs: Surah[];
  resume: { surahId: number; ayahIndex: number } | null;
  bookmarks: Bookmark[];
  onResume: () => void;
  onStartReading: () => void;
  onBrowse: (trigger: HTMLElement) => void;
  onOpenBookmark: (bookmark: Bookmark) => void;
  onSelectSurah: (surahId: number) => void;
}

const FEATURED = [1, 36, 55, 67, 112];

export default function HomeWelcome({
  surahs, resume, bookmarks, onResume, onStartReading, onBrowse, onOpenBookmark, onSelectSurah,
}: HomeWelcomeProps) {
  const resumeSurah = resume ? surahs.find((s) => s.number === resume.surahId) : undefined;
  const featured = FEATURED.map((n) => surahs.find((s) => s.number === n)).filter((s): s is Surah => Boolean(s));

  return (
    <main className="home-welcome" aria-labelledby="home-title">
      <p className="eyebrow">WELCOME</p>
      <p className="home-bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
      <h1 id="home-title">As-salamu alaykum</h1>
      <p className="home-lead">Read, listen and reflect on the Quran, one verse at a time.</p>

      <div className="home-actions">
        {resume && (
          <button type="button" className="resume-action" onClick={onResume}>
            Resume: {resumeSurah?.nameTransliteration ?? `Surah ${resume.surahId}`} · Verse {resume.ayahIndex + 1}
          </button>
        )}
        <button type="button" className={resume ? "home-secondary" : "resume-action"} onClick={onStartReading}>
          {resume ? "Open reader" : "Start reading"}
        </button>
        <button type="button" className="home-secondary" onClick={(e) => onBrowse(e.currentTarget)}>
          Browse Surahs
        </button>
      </div>

      {bookmarks.length > 0 && (
        <section className="home-section" aria-label="Saved verses">
          <h2>Saved verses</h2>
          <ul className="home-list">
            {bookmarks.slice(0, 3).map((b) => (
              <li key={`${b.surahId}:${b.verseNumber}`}>
                <button type="button" onClick={() => onOpenBookmark(b)}>
                  <strong>{b.surahTitle} · {b.verseNumber}</strong>
                  <span>{b.snippet}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section className="home-section" aria-label="Popular Surahs">
          <h2>Popular Surahs</h2>
          <div className="home-chips">
            {featured.map((s) => (
              <button key={s.number} type="button" className="home-chip" onClick={() => onSelectSurah(s.number)}>
                {s.nameTransliteration}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
