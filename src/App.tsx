import { useCallback, useEffect, useRef, useState } from "react";
import AudioPlayerBar from "./components/AudioPlayerBar";
import BottomNav from "./components/BottomNav";
import HomeWelcome from "./components/HomeWelcome";
import DisplaySettingsSheet from "./components/DisplaySettingsSheet";
import QuranReader from "./components/QuranReader";
import ReciterSelector from "./components/ReciterSelector";
import SurahList, { type LibraryView } from "./components/SurahList";
import { AudioPlayerProvider, useAudioPlayer } from "./context/AudioPlayerContext";
import { useBookmarks } from "./hooks/useBookmarks";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { useReadingPreferences } from "./hooks/useReadingPreferences";
import { fetchSurahs, getReciters } from "./services/quranApi";
import { SAMPLE_SURAHS } from "./services/sampleData";
import type { Ayah, Bookmark, Surah } from "./types";

interface SavedPosition {
  surahId: number;
  ayahIndex: number;
}

function readSavedPosition(): SavedPosition | null {
  try {
    const saved = localStorage.getItem("myquranreciter.playback");
    if (!saved) return null;
    const position = JSON.parse(saved) as { surahId?: unknown; ayahIndex?: unknown };
    if (
      typeof position.surahId === "number" &&
      Number.isInteger(position.surahId) &&
      position.surahId >= 1 &&
      position.surahId <= 114 &&
      typeof position.ayahIndex === "number" &&
      Number.isInteger(position.ayahIndex) &&
      position.ayahIndex >= 0
    ) {
      return { surahId: position.surahId, ayahIndex: position.ayahIndex };
    }
    return null;
  } catch (error) {
    console.error("Unable to read the last Quran reading position.", error);
    return null;
  }
}

function QuranApp() {
  const [surahs, setSurahs] = useState<Surah[]>(SAMPLE_SURAHS);
  const [surahNotice, setSurahNotice] = useState("");
  const [verseNotice, setVerseNotice] = useState("");
  const dataNotice = verseNotice || surahNotice;
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchSurahs(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setSurahs(result.data);
        setSurahNotice(result.notice ?? "");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSurahNotice(error instanceof Error ? error.message : "Unable to load Surah list.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSurahs(false);
      });
    return () => controller.abort();
  }, []);

  const handleDataNotice = useCallback((notice: string) => setVerseNotice(notice), []);

  return (
    <AudioPlayerProvider surahs={surahs} onDataNotice={handleDataNotice}>
      <AppContents dataNotice={dataNotice} isLoadingSurahs={isLoadingSurahs} />
    </AudioPlayerProvider>
  );
}

interface AppContentsProps {
  dataNotice: string;
  isLoadingSurahs: boolean;
}

function AppContents({ dataNotice, isLoadingSurahs }: AppContentsProps) {
  const readingPreferences = useReadingPreferences();
  const { bookmarks, toggleBookmark, removeBookmark } = useBookmarks();
  const { isInstallable, isIOSSafari, isStandalone, install, installError } = usePWAInstall();
  const [view, setView] = useState<"home" | "reader">("home");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const displayToggleRef = useRef<HTMLElement | null>(null);
  const libraryReturnRef = useRef<HTMLElement | null>(null);
  const [libraryView, setLibraryView] = useState<LibraryView>("surahs");
  const isDarkTheme = readingPreferences.theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDarkTheme ? "#141b17" : "#f6f7f2");
  }, [isDarkTheme]);

  const closeDisplay = useCallback(() => setIsDisplayOpen(false), []);
  const [showIOSInstallHelp, setShowIOSInstallHelp] = useState(false);
  const [resumePosition] = useState(readSavedPosition);
  const [showResumeBanner, setShowResumeBanner] = useState(Boolean(resumePosition));
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const installHelpCloseRef = useRef<HTMLButtonElement>(null);
  const {
    state,
    surahs,
    verses,
    currentSurah,
    isLoadingVerses,
    isLoadingWords,
    wordDataNotice,
    selectSurah,
    playSurah,
    playVerse,
    setReciter,
    togglePlayback,
    previousVerse,
    nextVerse,
    toggleMute,
  } = useAudioPlayer();

  const toggleVerseBookmark = useCallback((verse: Ayah) => {
    if (!currentSurah) return;
    toggleBookmark({
      surahId: currentSurah.number,
      verseNumber: verse.numberInSurah,
      surahTitle: currentSurah.nameTransliteration,
      snippet: (verse.translation || verse.text).slice(0, 140),
    });
  }, [currentSurah, toggleBookmark]);

  const openLibrary = useCallback((view: LibraryView, trigger: HTMLElement | null) => {
    libraryReturnRef.current = trigger;
    setLibraryView(view);
    setIsLibraryOpen(true);
  }, []);

  const openDisplay = useCallback((trigger: HTMLElement | null) => {
    displayToggleRef.current = trigger;
    setIsDisplayOpen(true);
  }, []);

  const goHome = useCallback(() => {
    setIsLibraryOpen(false);
    setIsDisplayOpen(false);
    setView("home");
    window.scrollTo({ top: 0 });
  }, []);

  const goToReading = useCallback(() => {
    setView("reader");
    setIsLibraryOpen(false);
    setIsDisplayOpen(false);
    const active = document.querySelector<HTMLElement>(".verse-card-row.active");
    if (active) active.scrollIntoView({ behavior: "smooth", block: "center" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeLibrary = useCallback(() => {
    setIsLibraryOpen(false);
    window.requestAnimationFrame(() => libraryReturnRef.current?.focus());
  }, []);

  const selectBookmark = useCallback((bookmark: Bookmark) => {
    setView("reader");
    playVerse(bookmark.surahId, bookmark.verseNumber - 1);
    closeLibrary();
  }, [closeLibrary, playVerse]);

  const closeIOSInstallHelp = useCallback(() => {
    setShowIOSInstallHelp(false);
    window.requestAnimationFrame(() => installButtonRef.current?.focus());
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowIOSInstallHelp(true);
  }, [install, isInstallable]);

  const handleSelectSurah = useCallback((surahId: number) => {
    setView("reader");
    selectSurah(surahId);
    closeLibrary();
  }, [closeLibrary, selectSurah]);

  useEffect(() => {
    if (showIOSInstallHelp) installHelpCloseRef.current?.focus();
  }, [showIOSInstallHelp]);

  useEffect(() => {
    const closeDrawerOnDesktop = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setIsLibraryOpen(false);
    };
    window.addEventListener("resize", closeDrawerOnDesktop);
    return () => window.removeEventListener("resize", closeDrawerOnDesktop);
  }, []);

  useEffect(() => {
    if (isLibraryOpen) document.body.classList.add("mobile-drawer-open");
    else document.body.classList.remove("mobile-drawer-open");
    return () => document.body.classList.remove("mobile-drawer-open");
  }, [isLibraryOpen]);

  useEffect(() => {
    if (!isLibraryOpen && !showIOSInstallHelp) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isLibraryOpen) closeLibrary();
      if (showIOSInstallHelp) closeIOSInstallHelp();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeIOSInstallHelp, closeLibrary, isLibraryOpen, showIOSInstallHelp]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.repeat || target?.isContentEditable ||
        target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Space") {
        if (target?.matches("button, a")) return;
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousVerse();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextVerse();
      } else if (event.key.toLowerCase() === "m") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextVerse, previousVerse, toggleMute, togglePlayback]);

  return (
    <div className="app-shell" dir="ltr">
      <header className="site-header" hidden={view === "home"}>
        <button
          className="mobile-library-toggle"
          type="button"
          aria-label={isLibraryOpen ? "Close Surah library" : "Open Surah library"}
          aria-expanded={isLibraryOpen}
          aria-controls="surah-library"
          onClick={(event) => {
            if (isLibraryOpen) closeLibrary();
            else openLibrary("surahs", event.currentTarget);
          }}
        >☰</button>
        <a className="brand" href="#" aria-label="My Quran Reciter home" onClick={(e) => { e.preventDefault(); goHome(); }}>
          <span className="brand-mark" aria-hidden="true">۞</span>
          <span>my<span className="brand-accent">quran</span>reciter</span>
        </a>
        <div className="header-actions">
          <span className="header-caption">A little space for reflection</span>
          {!isStandalone && (isInstallable || isIOSSafari) && (
            <button
              ref={installButtonRef}
              className="install-app-button"
              type="button"
              aria-label="Install App"
              onClick={() => void handleInstallClick()}
            >
              <span aria-hidden="true">↓</span>
              <span className="install-button-label">Install App</span>
            </button>
          )}
          <button
            className="display-settings-button"
            type="button"
            aria-label="Display settings"
            aria-haspopup="dialog"
            aria-expanded={isDisplayOpen}
            aria-controls="display-settings"
            onClick={(event) => openDisplay(event.currentTarget)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
          </button>
          <ReciterSelector
            reciters={getReciters()}
            selectedReciterId={state.currentReciterId}
            onChange={setReciter}
          />
        </div>
      </header>

      {installError && <p className="install-error" role="status">{installError}</p>}

      {showIOSInstallHelp && (
        <div className="install-help-backdrop" onClick={closeIOSInstallHelp}>
          <section
            className="install-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={installHelpCloseRef}
              className="install-help-close"
              type="button"
              aria-label="Close install instructions"
              onClick={closeIOSInstallHelp}
            >×</button>
            <p className="eyebrow">KEEP IT CLOSE</p>
            <h2 id="install-help-title">Add to your Home Screen</h2>
            <ol>
              <li>Tap the <strong>Share</strong> button in Safari.</li>
              <li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li>
            </ol>
          </section>
        </div>
      )}

      {view === "reader" && showResumeBanner && resumePosition && (
        <div className="resume-banner" role="status">
          <span>
            Pick up where you left off: <strong>{surahs.find((surah) => surah.number === resumePosition.surahId)?.nameTransliteration ?? `Surah ${resumePosition.surahId}`}</strong>
            {" "}· Verse {resumePosition.ayahIndex + 1}
          </span>
          <button
            type="button"
            className="resume-action"
            onClick={() => {
              playVerse(resumePosition.surahId, resumePosition.ayahIndex);
              setShowResumeBanner(false);
            }}
          >Resume reading</button>
          <button
            type="button"
            className="resume-dismiss"
            aria-label="Dismiss resume banner"
            onClick={() => setShowResumeBanner(false)}
          >×</button>
        </div>
      )}

      {view === "home" && (
        <HomeWelcome
          surahs={surahs}
          resume={resumePosition}
          showInstall={!isStandalone && (isInstallable || isIOSSafari)}
          onInstall={() => void handleInstallClick()}
          onResume={() => {
            if (!resumePosition) return;
            setView("reader");
            setShowResumeBanner(false);
            playVerse(resumePosition.surahId, resumePosition.ayahIndex);
          }}
          onOpenSurah={handleSelectSurah}
          onPlaySurah={(id) => { setView("reader"); playSurah(id); }}
        />
      )}

      <main className="workspace" hidden={view === "home" && !isLibraryOpen}>
        <SurahList
          surahs={surahs}
          selectedSurahId={state.surahId}
          onSelect={handleSelectSurah}
          bookmarks={bookmarks}
          onSelectBookmark={selectBookmark}
          onRemoveBookmark={removeBookmark}
          isOpen={isLibraryOpen}
          onClose={closeLibrary}
          view={libraryView}
          onViewChange={setLibraryView}
        />
        <div className="reader-column">
          {dataNotice && (
            <p className="data-notice" role="status">
              <span aria-hidden="true">ⓘ</span> {dataNotice}
            </p>
          )}
          {isLoadingSurahs && <p className="sr-only" role="status">Loading Surah list…</p>}
          <QuranReader
            surah={currentSurah}
            verses={verses}
            activeVerseIndex={state.ayahIndex}
            isPlaying={state.isPlaying}
            isLoading={isLoadingVerses}
            onPlaySurah={() => playSurah(state.surahId)}
            onPlayVerse={(index) => playVerse(state.surahId, index)}
            arabicFontSize={readingPreferences.arabicFontSize}
            showTranslation={readingPreferences.showTranslation}
            showTransliteration={readingPreferences.showTransliteration}
            theme={readingPreferences.theme}
            bookmarks={bookmarks}
            onToggleBookmark={toggleVerseBookmark}
            isLoadingWords={isLoadingWords}
            wordDataNotice={wordDataNotice}
          />
        </div>
      </main>

      <DisplaySettingsSheet
        open={isDisplayOpen}
        onClose={closeDisplay}
        returnFocusRef={displayToggleRef}
        arabicFontSize={readingPreferences.arabicFontSize}
        showTranslation={readingPreferences.showTranslation}
        showTransliteration={readingPreferences.showTransliteration}
        theme={readingPreferences.theme}
        onArabicFontSizeChange={readingPreferences.setArabicFontSize}
        onToggleTranslation={readingPreferences.toggleTranslation}
        onToggleTransliteration={readingPreferences.toggleTransliteration}
        onThemeChange={readingPreferences.setTheme}
      />
      <AudioPlayerBar />
      <BottomNav
        active={isDisplayOpen ? "settings" : view === "home" && !isLibraryOpen ? "home" : isLibraryOpen ? (libraryView === "bookmarks" ? "bookmarks" : "library") : "read"}
        bookmarkCount={bookmarks.length}
        onHome={goHome}
        onRead={goToReading}
        onLibrary={(trigger) => openLibrary("surahs", trigger)}
        onBookmarks={(trigger) => openLibrary("bookmarks", trigger)}
        onSettings={openDisplay}
      />
      <p className="keyboard-hint"><kbd>Space</kbd> play · <kbd>←</kbd>/<kbd>→</kbd> verse · <kbd>M</kbd> mute</p>
    </div>
  );
}

export default function App() {
  return <QuranApp />;
}
