import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark, Surah } from "../types";
import { fetchTranslationSearchIndex } from "../services/quranApi";

interface SurahListProps {
  surahs: Surah[];
  selectedSurahId: number;
  onSelect: (surahId: number) => void;
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onRemoveBookmark: (surahId: number, verseNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SurahList({
  surahs,
  selectedSurahId,
  onSelect,
  bookmarks,
  onSelectBookmark,
  onRemoveBookmark,
  isOpen,
  onClose,
}: SurahListProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"surahs" | "bookmarks">("surahs");
  const [translationIndex, setTranslationIndex] = useState<Record<number, string> | null>(null);
  const [translationNotice, setTranslationNotice] = useState("");
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const hasRequestedTranslations = useRef(false);
  const searchController = useRef<AbortController | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => searchController.current?.abort(), []);
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  const filteredSurahs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return surahs;
    return surahs.filter((surah) => {
      const titleMatches = `${surah.number} ${surah.nameArabic} ${surah.nameTransliteration} ${surah.nameEnglish}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
      return titleMatches || Boolean(translationIndex?.[surah.number]?.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [query, surahs, translationIndex]);

  const updateQuery = (value: string) => {
    setQuery(value);
    if (!value.trim() || hasRequestedTranslations.current) return;

    hasRequestedTranslations.current = true;
    const controller = new AbortController();
    searchController.current = controller;
    setIsLoadingTranslations(true);
    fetchTranslationSearchIndex(controller.signal)
      .then((result) => {
        setTranslationIndex(result.data);
        setTranslationNotice(result.notice ?? "");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setTranslationIndex({});
        setTranslationNotice(error instanceof Error ? error.message : "Unable to search verse translations.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingTranslations(false);
      });
  };

  return (
    <>
      {isOpen && (
        <button
          className="mobile-drawer-backdrop"
          type="button"
          aria-label="Close Surah library"
          onClick={onClose}
        />
      )}
      <aside
        id="surah-library"
        className={`surah-panel panel${isOpen ? " drawer-open" : ""}`}
        aria-label="Surah library"
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? true : undefined}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">YOUR LIBRARY</p>
            <h2>Surahs</h2>
          </div>
          <div className="panel-heading-actions">
            <span className="count-pill">{surahs.length}</span>
            <button
              ref={closeButtonRef}
              className="drawer-close-button"
              type="button"
              aria-label="Close Surah library"
              onClick={onClose}
            >×</button>
          </div>
        </div>
        <div className="library-tabs" role="tablist" aria-label="Library views">
          <button
            type="button"
            role="tab"
            aria-selected={view === "surahs"}
            onClick={() => setView("surahs")}
          >Surahs</button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "bookmarks"}
            onClick={() => setView("bookmarks")}
          >Bookmarks <span>{bookmarks.length}</span></button>
        </div>
        {view === "surahs" ? (
          <>
            <label className="search-field">
              <span className="sr-only">Search Surahs and verse translations</span>
              <span aria-hidden="true" className="search-icon">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search names or translations"
              />
            </label>
            {translationNotice && <p className="translation-search-notice" role="status">{translationNotice}</p>}
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
                <p className="empty-state" role={isLoadingTranslations ? "status" : undefined}>
                  {isLoadingTranslations
                    ? "Searching verse translations…"
                    : `No Surahs match “${query}”. Try another search.`}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="bookmark-list" role="list">
            {bookmarks.map((bookmark) => (
              <div className="bookmark-row" role="listitem" key={`${bookmark.surahId}:${bookmark.verseNumber}`}>
                <button
                  className="bookmark-content"
                  type="button"
                  onClick={() => {
                    setView("surahs");
                    setQuery("");
                    onSelectBookmark(bookmark);
                  }}
                >
                  <strong>{bookmark.surahTitle} · Verse {bookmark.verseNumber}</strong>
                  <span>{bookmark.snippet}</span>
                </button>
                <button
                  className="bookmark-remove"
                  type="button"
                  aria-label={`Remove ${bookmark.surahTitle} verse ${bookmark.verseNumber} bookmark`}
                  onClick={() => onRemoveBookmark(bookmark.surahId, bookmark.verseNumber)}
                >×</button>
              </div>
            ))}
            {bookmarks.length === 0 && <p className="empty-state">Your saved verses will appear here.</p>}
          </div>
        )}
        <p className="library-note">Select a chapter to read or begin listening.</p>
      </aside>
    </>
  );
}
