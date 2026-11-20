import { useCallback, useEffect, useState } from "react";
import AudioPlayerBar from "./components/AudioPlayerBar";
import QuranReader from "./components/QuranReader";
import ReciterSelector from "./components/ReciterSelector";
import SurahList from "./components/SurahList";
import { AudioPlayerProvider, useAudioPlayer } from "./context/AudioPlayerContext";
import { fetchSurahs, getReciters } from "./services/quranApi";
import { SAMPLE_SURAHS } from "./services/sampleData";
import type { Surah } from "./types";

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
  const {
    state,
    surahs,
    verses,
    currentSurah,
    isLoadingVerses,
    selectSurah,
    playSurah,
    playVerse,
    setReciter,
  } = useAudioPlayer();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.matches("input, textarea, select, button")) return;
      event.preventDefault();
      const playButton = document.querySelector<HTMLButtonElement>(".player-bar .play-button");
      playButton?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="app-shell" dir="ltr">
      <header className="site-header">
        <a className="brand" href="#" aria-label="My Quran Reciter home">
          <span className="brand-mark" aria-hidden="true">۞</span>
          <span>my<span className="brand-accent">quran</span>reciter</span>
        </a>
        <div className="header-actions">
          <span className="header-caption">A little space for reflection</span>
          <ReciterSelector
            reciters={getReciters()}
            selectedReciterId={state.currentReciterId}
            onChange={setReciter}
          />
        </div>
      </header>

      <main className="workspace">
        <SurahList surahs={surahs} selectedSurahId={state.surahId} onSelect={selectSurah} />
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
          />
        </div>
      </main>

      <AudioPlayerBar />
      <p className="keyboard-hint"><kbd>Space</kbd> play or pause</p>
    </div>
  );
}

export default function App() {
  return <QuranApp />;
}
