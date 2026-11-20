import { useMemo, useState } from "react";
import type { Surah } from "../types";

interface SurahListProps {
  surahs: Surah[];
  selectedSurahId: number;
  onSelect: (surahId: number) => void;
}

export default function SurahList({ surahs, selectedSurahId, onSelect }: SurahListProps) {
  const [query, setQuery] = useState("");
  const filteredSurahs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return surahs;
    return surahs.filter((surah) =>
      `${surah.number} ${surah.nameArabic} ${surah.nameTransliteration} ${surah.nameEnglish}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, surahs]);

  return (
    <aside className="surah-panel panel" aria-label="Surah library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Surahs</h2>
        </div>
        <span className="count-pill">{surahs.length}</span>
      </div>
      <label className="search-field">
        <span className="sr-only">Search surahs</span>
        <span aria-hidden="true" className="search-icon">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or number"
        />
      </label>
      <div className="surah-list" role="list">
        {filteredSurahs.map((surah) => (
          <button
            className={`surah-row${selectedSurahId === surah.number ? " selected" : ""}`}
            key={surah.number}
            type="button"
            role="listitem"
            aria-current={selectedSurahId === surah.number ? "true" : undefined}
            onClick={() => onSelect(surah.number)}
          >
            <span className="surah-number">{surah.number}</span>
            <span className="surah-details">
              <span className="surah-title">{surah.nameTransliteration}</span>
              <span className="surah-meta">{surah.nameEnglish} · {surah.numberOfAyahs} verses</span>
            </span>
            <span className="surah-arabic" lang="ar" dir="rtl">{surah.nameArabic}</span>
          </button>
        ))}
        {filteredSurahs.length === 0 && (
          <p className="empty-state">No Surahs match “{query}”. Try another search.</p>
        )}
      </div>
      <p className="library-note">Select a chapter to read or begin listening.</p>
    </aside>
  );
}
