import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Ayah, PlaybackState, QuranWord, Reciter, Surah } from "../types";
import { getSampleVerses } from "../services/sampleData";
import { fetchVerses, fetchWordsBySurah, getReciters, getVerseAudioUrl } from "../services/quranApi";

interface AudioPlayerValue {
  state: PlaybackState;
  surahs: Surah[];
  verses: Ayah[];
  currentSurah?: Surah;
  currentReciter: Reciter;
  dataNotice: string;
  wordDataNotice: string;
  isLoadingVerses: boolean;
  isLoadingWords: boolean;
  selectSurah: (surahId: number) => void;
  playSurah: (surahId: number) => void;
  playVerse: (surahId: number, ayahIndex: number) => void;
  togglePlayback: () => void;
  nextVerse: () => void;
  previousVerse: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setReciter: (reciterId: string) => void;
  toggleRepeat: () => void;
  toggleMute: () => void;
  toggleAbLoop: () => void;
  setAbStartIndex: (index: number) => void;
  setAbEndIndex: (index: number) => void;
  setRecitationPauseSeconds: (seconds: 0 | 2 | 4 | 6) => void;
}

const AudioPlayerContext = createContext<AudioPlayerValue | null>(null);

interface AudioPlayerProviderProps {
  children: ReactNode;
  surahs: Surah[];
  onDataNotice: (notice: string) => void;
}

export function AudioPlayerProvider({ children, surahs, onDataNotice }: AudioPlayerProviderProps) {
  const reciters = useMemo(() => getReciters(), []);
  const [state, setState] = useState<PlaybackState>(() => {
    const initial: PlaybackState = {
      surahId: 1,
      ayahIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      volume: 0.8,
      repeatMode: "off",
      currentReciterId: "alafasy",
      isMuted: false,
      abLoopEnabled: false,
      abStartIndex: 0,
      abEndIndex: -1,
      recitationPauseSeconds: 0,
    };
    try {
      const saved = localStorage.getItem("myquranreciter.playback");
      if (!saved) return initial;
      const preferences = JSON.parse(saved) as {
        surahId?: unknown;
        ayahIndex?: unknown;
        currentReciterId?: unknown;
      };
      return {
        ...initial,
        surahId: typeof preferences.surahId === "number" && preferences.surahId >= 1 && preferences.surahId <= 114
          ? Math.floor(preferences.surahId)
          : initial.surahId,
        ayahIndex: typeof preferences.ayahIndex === "number" && preferences.ayahIndex >= 0
          ? Math.floor(preferences.ayahIndex)
          : initial.ayahIndex,
        currentReciterId: typeof preferences.currentReciterId === "string" &&
          reciters.some((reciter) => reciter.id === preferences.currentReciterId)
          ? preferences.currentReciterId
          : initial.currentReciterId,
      };
    } catch (error) {
      console.error("Unable to read saved Quran playback preferences.", error);
      return initial;
    }
  });
  const [verses, setVerses] = useState<Ayah[]>(() => getSampleVerses(state.surahId));
  const [wordsByVerse, setWordsByVerse] = useState<Record<number, QuranWord[]>>({});
  const [isLoadingVerses, setIsLoadingVerses] = useState(true);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [loadedSurahId, setLoadedSurahId] = useState(state.surahId);
  const [dataNotice, setDataNotice] = useState("");
  const [wordDataNotice, setWordDataNotice] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAyahIndex = useRef<number | null>(state.ayahIndex);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const prefetchRef = useRef<HTMLAudioElement | null>(null);
  const MAX_PLAY_RETRIES = 4;
  const currentReciter = reciters.find((reciter) => reciter.id === state.currentReciterId) ?? reciters[0];
  const currentSurah = surahs.find((surah) => surah.number === state.surahId);
  const versesWithWords = useMemo(() => verses.map((verse) => ({
    ...verse,
    words: wordsByVerse[verse.numberInSurah] ?? [],
  })), [verses, wordsByVerse]);
  const activeVerse = versesWithWords[state.ayahIndex];
  const trackUrl = loadedSurahId === state.surahId && activeVerse
    ? getVerseAudioUrl(currentReciter, state.surahId, activeVerse.numberInSurah)
    : "";

  useEffect(() => {
    try {
      localStorage.setItem("myquranreciter.playback", JSON.stringify({
        surahId: state.surahId,
        ayahIndex: state.ayahIndex,
        currentReciterId: state.currentReciterId,
      }));
    } catch (error) {
      console.error("Unable to save Quran playback preferences.", error);
    }
  }, [state.surahId, state.ayahIndex, state.currentReciterId]);

  const reportDataNotice = useCallback((notice: string) => {
    setDataNotice(notice);
    onDataNotice(notice);
  }, [onDataNotice]);

  const clearPendingPause = useCallback(() => {
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPendingPause(), [clearPendingPause]);

  useEffect(() => {
    const controller = new AbortController();
    const sample = getSampleVerses(state.surahId);
    reportDataNotice("");
    setVerses(sample);
    setLoadedSurahId(state.surahId);
    setIsLoadingVerses(true);
    setState((current) => ({ ...current, currentTime: 0, duration: 0 }));
    const requestedSurahId = state.surahId;

    fetchVerses(requestedSurahId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setVerses(result.data);
        setLoadedSurahId(requestedSurahId);
        setIsLoadingVerses(false);
        if (pendingAyahIndex.current !== null) {
          const requestedAyahIndex = pendingAyahIndex.current;
          setState((current) => ({
            ...current,
            ayahIndex: Math.min(requestedAyahIndex, Math.max(result.data.length - 1, 0)),
          }));
          pendingAyahIndex.current = null;
        }
        reportDataNotice(result.notice ?? "");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setIsLoadingVerses(false);
          reportDataNotice(error instanceof Error ? error.message : "Unable to load Quran verses.");
        }
      });

    return () => controller.abort();
  }, [state.surahId, reportDataNotice]);

  useEffect(() => {
    const controller = new AbortController();
    setWordsByVerse({});
    setWordDataNotice("");
    setIsLoadingWords(true);
    fetchWordsBySurah(state.surahId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setWordsByVerse(result);
        setIsLoadingWords(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setWordsByVerse({});
        setIsLoadingWords(false);
        setWordDataNotice(error instanceof Error ? error.message : "Unable to load word-by-word data.");
      });
    return () => controller.abort();
  }, [state.surahId]);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearRetry(), [clearRetry]);

  // Start playback; on transient failures (flaky network, background throttling) reload and
  // retry with backoff instead of silently stopping the recitation.
  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearRetry();
    audio.play().then(() => {
      retryCountRef.current = 0;
    }).catch((error: unknown) => {
      // AbortError: a newer load/pause superseded this call, which is expected.
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (retryCountRef.current < MAX_PLAY_RETRIES) {
        const delay = 700 * 2 ** retryCountRef.current;
        retryCountRef.current += 1;
        reportDataNotice("Connection hiccup, retrying audio…");
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          const current = audioRef.current;
          if (!current) return;
          const keepTime = current.currentTime;
          current.load();
          if (keepTime > 0) current.currentTime = keepTime;
          startPlayback();
        }, delay);
        return;
      }
      retryCountRef.current = 0;
      setState((current) => ({ ...current, isPlaying: false }));
      reportDataNotice("Audio could not be played. Check your connection and try again.");
    });
  }, [clearRetry, reportDataNotice]);

  // Source management. The element is never reset between verses: replacing `src` on the same
  // element keeps it "active" so mobile browsers still allow playback with the screen locked.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!trackUrl) return;
    if (audio.src !== trackUrl) {
      audio.src = trackUrl;
    }
    // Warm the cache with the next verse so the transition does not depend on the network.
    const nextVerse = versesWithWords[state.ayahIndex + 1];
    if (nextVerse) {
      const prefetch = prefetchRef.current ?? new Audio();
      prefetch.preload = "auto";
      prefetch.src = getVerseAudioUrl(currentReciter, state.surahId, nextVerse.numberInSurah);
      prefetchRef.current = prefetch;
    }
  }, [trackUrl, state.ayahIndex, state.surahId, currentReciter, versesWithWords]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    prefetchRef.current = null;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = state.playbackRate;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.playbackRate, state.volume, state.isMuted, trackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.isPlaying && trackUrl) {
      if (audio.src !== trackUrl) audio.src = trackUrl;
      if (audio.paused || audio.ended) startPlayback();
    } else {
      clearRetry();
      retryCountRef.current = 0;
      audio.pause();
    }
  }, [trackUrl, state.isPlaying, startPlayback, clearRetry]);

  const switchToSurah = useCallback((surahId: number, ayahIndex: number, shouldPlay: boolean) => {
    clearPendingPause();
    pendingAyahIndex.current = ayahIndex;
    setState((current) => ({
      ...current,
      surahId,
      ayahIndex,
      isPlaying: shouldPlay,
      currentTime: 0,
      duration: 0,
      ...(surahId !== state.surahId
        ? { abLoopEnabled: false, abStartIndex: 0, abEndIndex: -1 }
        : {}),
    }));
    if (surahId === state.surahId) {
      pendingAyahIndex.current = null;
    }
  }, [clearPendingPause, state.surahId]);

  const selectSurah = useCallback((surahId: number) => {
    switchToSurah(surahId, 0, false);
  }, [switchToSurah]);

  const playSurah = useCallback((surahId: number) => {
    switchToSurah(surahId, 0, true);
  }, [switchToSurah]);

  const playVerse = useCallback((surahId: number, ayahIndex: number) => {
    switchToSurah(surahId, ayahIndex, true);
  }, [switchToSurah]);

  const moveVerse = useCallback((direction: -1 | 1): boolean => {
    const newIndex = state.ayahIndex + direction;
    if (newIndex >= 0 && newIndex < verses.length) {
      setState((current) => ({ ...current, ayahIndex: newIndex, currentTime: 0, duration: 0 }));
      return true;
    }

    const currentSurahIndex = surahs.findIndex((surah) => surah.number === state.surahId);
    const adjacentSurah = surahs[currentSurahIndex + direction];
    if (!adjacentSurah) {
      if (direction === 1) setState((current) => ({ ...current, isPlaying: false }));
      return false;
    }
    const targetIndex = direction === -1 ? adjacentSurah.numberOfAyahs - 1 : 0;
    switchToSurah(adjacentSurah.number, targetIndex, state.isPlaying);
    return true;
  }, [state.ayahIndex, state.isPlaying, state.surahId, surahs, switchToSurah, verses.length]);

  const onEnded = useCallback(() => {
    const scheduleTransition = (transition: () => boolean) => {
      clearPendingPause();
      if (state.recitationPauseSeconds === 0) {
        transition();
        return;
      }

      setState((current) => ({ ...current, isPlaying: false }));
      pauseTimerRef.current = setTimeout(() => {
        pauseTimerRef.current = null;
        if (transition()) {
          setState((current) => ({ ...current, isPlaying: true }));
        }
      }, state.recitationPauseSeconds * 1000);
    };

    const abEndIndex = state.abEndIndex < 0 ? verses.length - 1 : state.abEndIndex;
    if (state.abLoopEnabled && state.ayahIndex >= abEndIndex) {
      scheduleTransition(() => {
        setState((current) => ({
          ...current,
          ayahIndex: current.abStartIndex,
          currentTime: 0,
          duration: 0,
        }));
        return true;
      });
      return;
    }
    if (state.repeatMode === "verse" && !state.abLoopEnabled) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        startPlayback();
      }
      return;
    }
    if (state.repeatMode === "surah" && state.ayahIndex === verses.length - 1) {
      scheduleTransition(() => {
        switchToSurah(state.surahId, 0, true);
        return true;
      });
      return;
    }
    const nextAyah = versesWithWords[state.ayahIndex + 1];
    const audio = audioRef.current;
    if (state.recitationPauseSeconds === 0 && nextAyah && audio) {
      // Start the next verse synchronously inside the `ended` event: the most reliable way to
      // keep playing in the background / with the screen locked.
      clearPendingPause();
      audio.src = getVerseAudioUrl(currentReciter, state.surahId, nextAyah.numberInSurah);
      startPlayback();
      setState((current) => ({ ...current, ayahIndex: current.ayahIndex + 1, currentTime: 0, duration: 0 }));
      return;
    }
    scheduleTransition(() => moveVerse(1));
  }, [
    currentReciter, startPlayback, versesWithWords,
    clearPendingPause, moveVerse, reportDataNotice, state.abEndIndex, state.abLoopEnabled, state.ayahIndex,
    state.recitationPauseSeconds, state.repeatMode, state.surahId, switchToSurah, verses.length,
  ]);

  const togglePlayback = useCallback(() => {
    if (pauseTimerRef.current !== null) {
      clearPendingPause();
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
      setState((current) => ({ ...current, isPlaying: true, currentTime: 0 }));
      return;
    }
    setState((current) => ({ ...current, isPlaying: !current.isPlaying }));
  }, [clearPendingPause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(time)) audio.currentTime = time;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState((current) => ({ ...current, playbackRate: rate }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((current) => ({ ...current, volume: Math.max(0, Math.min(1, volume)), isMuted: false }));
  }, []);

  const setReciter = useCallback((reciterId: string) => {
    setState((current) => ({ ...current, currentReciterId: reciterId }));
  }, []);

  const setRecitationPauseSeconds = useCallback((seconds: 0 | 2 | 4 | 6) => {
    setState((current) => ({ ...current, recitationPauseSeconds: seconds }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((current) => ({
      ...current,
      repeatMode: current.repeatMode === "off" ? "verse" : current.repeatMode === "verse" ? "surah" : "off",
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((current) => ({ ...current, isMuted: !current.isMuted }));
  }, []);

  const toggleAbLoop = useCallback(() => {
    setState((current) => {
      const enabled = !current.abLoopEnabled;
      const endIndex = current.abEndIndex < 0 ? verses.length - 1 : current.abEndIndex;
      const isInRange = current.ayahIndex >= current.abStartIndex && current.ayahIndex <= endIndex;
      return {
        ...current,
        abLoopEnabled: enabled,
        ...(enabled && !isInRange
          ? { ayahIndex: current.abStartIndex, currentTime: 0, duration: 0 }
          : {}),
      };
    });
  }, [verses.length]);

  const setAbStartIndex = useCallback((index: number) => {
    const maxIndex = Math.max(verses.length - 1, 0);
    const startIndex = Math.max(0, Math.min(index, maxIndex));
    setState((current) => ({
      ...current,
      abStartIndex: startIndex,
      abEndIndex: current.abEndIndex >= 0 && current.abEndIndex < startIndex ? startIndex : current.abEndIndex,
    }));
  }, [verses.length]);

  const setAbEndIndex = useCallback((index: number) => {
    const maxIndex = Math.max(verses.length - 1, 0);
    const endIndex = Math.max(0, Math.min(index, maxIndex));
    setState((current) => ({
      ...current,
      abStartIndex: current.abStartIndex > endIndex ? endIndex : current.abStartIndex,
      abEndIndex: endIndex,
    }));
  }, [verses.length]);

  const nextVerse = useCallback(() => {
    clearPendingPause();
    moveVerse(1);
  }, [clearPendingPause, moveVerse]);

  const previousVerse = useCallback(() => {
    clearPendingPause();
    moveVerse(-1);
  }, [clearPendingPause, moveVerse]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const title = currentSurah
      ? `${currentSurah.nameTransliteration} · Verse ${activeVerse?.numberInSurah ?? state.ayahIndex + 1}`
      : "Quran recitation";
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: currentReciter.name, album: "My Quran Reciter" });
      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => setState((c) => ({ ...c, isPlaying: true })));
      navigator.mediaSession.setActionHandler("pause", () => setState((c) => ({ ...c, isPlaying: false })));
      navigator.mediaSession.setActionHandler("nexttrack", () => nextVerse());
      navigator.mediaSession.setActionHandler("previoustrack", () => previousVerse());
    } catch (error) {
      console.error("Media Session unavailable.", error);
    }
  }, [currentSurah, activeVerse, state.ayahIndex, state.isPlaying, currentReciter, nextVerse, previousVerse]);

  const value = useMemo<AudioPlayerValue>(() => ({
    state,
    surahs,
    verses: versesWithWords,
    currentSurah,
    currentReciter,
    dataNotice,
    wordDataNotice,
    isLoadingVerses,
    isLoadingWords,
    selectSurah,
    playSurah,
    playVerse,
    togglePlayback,
    nextVerse,
    previousVerse,
    seek,
    setPlaybackRate,
    setVolume,
    setReciter,
    toggleRepeat,
    toggleMute,
    toggleAbLoop,
    setAbStartIndex,
    setAbEndIndex,
    setRecitationPauseSeconds,
  }), [
    state, surahs, versesWithWords, currentSurah, currentReciter, dataNotice, wordDataNotice,
    isLoadingVerses, isLoadingWords, selectSurah, playSurah, playVerse, togglePlayback, nextVerse,
    previousVerse, seek, setPlaybackRate, setVolume, setReciter, toggleRepeat, toggleMute,
    toggleAbLoop, setAbStartIndex, setAbEndIndex, setRecitationPauseSeconds,
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(audio.currentTime)) return;
          const currentTime = audio.currentTime;
          setState((current) => ({ ...current, currentTime }));
        }}
        onDurationChange={() => {
          const audio = audioRef.current;
          if (!audio) return;
          const duration = audio.duration;
          setState((current) => ({
            ...current,
            duration: Number.isFinite(duration) && duration >= 0 ? duration : 0,
          }));
        }}
        onEnded={onEnded}
        onPlaying={() => {
          retryCountRef.current = 0;
          setDataNotice((n) => (n.startsWith("Connection hiccup") ? "" : n));
        }}
        onError={() => {
          if (state.isPlaying && trackUrl) startPlayback();
        }}
        onPlay={() => setState((current) => ({ ...current, isPlaying: true }))}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerValue {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error("useAudioPlayer must be used within AudioPlayerProvider.");
  return context;
}
