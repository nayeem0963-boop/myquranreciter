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
import type { Ayah, PlaybackState, Reciter, Surah } from "../types";
import { getSampleVerses } from "../services/sampleData";
import { fetchVerses, getReciters, getVerseAudioUrl } from "../services/quranApi";

interface AudioPlayerValue {
  state: PlaybackState;
  surahs: Surah[];
  verses: Ayah[];
  currentSurah?: Surah;
  currentReciter: Reciter;
  dataNotice: string;
  isLoadingVerses: boolean;
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
}

const AudioPlayerContext = createContext<AudioPlayerValue | null>(null);

interface AudioPlayerProviderProps {
  children: ReactNode;
  surahs: Surah[];
  onDataNotice: (notice: string) => void;
}

export function AudioPlayerProvider({ children, surahs, onDataNotice }: AudioPlayerProviderProps) {
  const [state, setState] = useState<PlaybackState>({
    surahId: 1,
    ayahIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    volume: 0.8,
    repeatCurrent: false,
    currentReciterId: "alafasy",
  });
  const [verses, setVerses] = useState<Ayah[]>(getSampleVerses(1));
  const [isLoadingVerses, setIsLoadingVerses] = useState(true);
  const [loadedSurahId, setLoadedSurahId] = useState(1);
  const [dataNotice, setDataNotice] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingAyahIndex = useRef<number | null>(null);
  const reciters = useMemo(() => getReciters(), []);
  const currentReciter = reciters.find((reciter) => reciter.id === state.currentReciterId) ?? reciters[0];
  const currentSurah = surahs.find((surah) => surah.number === state.surahId);
  const activeVerse = verses[state.ayahIndex];
  const trackUrl = loadedSurahId === state.surahId && activeVerse
    ? getVerseAudioUrl(currentReciter, state.surahId, activeVerse.numberInSurah)
    : "";

  const reportDataNotice = useCallback((notice: string) => {
    setDataNotice(notice);
    onDataNotice(notice);
  }, [onDataNotice]);

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
          setState((current) => ({
            ...current,
            ayahIndex: Math.min(pendingAyahIndex.current ?? 0, Math.max(result.data.length - 1, 0)),
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
    const audio = audioRef.current;
    if (!audio) return;

    if (!trackUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } else if (audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
    }

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [trackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let isCurrentEffect = true;
    audio.playbackRate = state.playbackRate;
    audio.volume = state.volume;

    if (state.isPlaying && trackUrl) {
      audio.play().catch(() => {
        if (!isCurrentEffect) return;
        setState((current) => ({ ...current, isPlaying: false }));
        reportDataNotice("Audio could not be played. Check your connection and try again.");
      });
    } else {
      audio.pause();
    }

    return () => {
      isCurrentEffect = false;
    };
  }, [trackUrl, state.isPlaying, state.playbackRate, state.volume, reportDataNotice]);

  const switchToSurah = useCallback((surahId: number, ayahIndex: number, shouldPlay: boolean) => {
    pendingAyahIndex.current = ayahIndex;
    setState((current) => ({
      ...current,
      surahId,
      ayahIndex,
      isPlaying: shouldPlay,
      currentTime: 0,
      duration: 0,
    }));
    if (surahId === state.surahId) {
      pendingAyahIndex.current = null;
    }
  }, [state.surahId]);

  const selectSurah = useCallback((surahId: number) => {
    switchToSurah(surahId, 0, false);
  }, [switchToSurah]);

  const playSurah = useCallback((surahId: number) => {
    switchToSurah(surahId, 0, true);
  }, [switchToSurah]);

  const playVerse = useCallback((surahId: number, ayahIndex: number) => {
    switchToSurah(surahId, ayahIndex, true);
  }, [switchToSurah]);

  const moveVerse = useCallback((direction: -1 | 1) => {
    const newIndex = state.ayahIndex + direction;
    if (newIndex >= 0 && newIndex < verses.length) {
      setState((current) => ({ ...current, ayahIndex: newIndex, currentTime: 0, duration: 0 }));
      return;
    }

    const currentSurahIndex = surahs.findIndex((surah) => surah.number === state.surahId);
    const adjacentSurah = surahs[currentSurahIndex + direction];
    if (!adjacentSurah) {
      if (direction === 1) setState((current) => ({ ...current, isPlaying: false }));
      return;
    }
    const targetIndex = direction === -1 ? adjacentSurah.numberOfAyahs - 1 : 0;
    switchToSurah(adjacentSurah.number, targetIndex, state.isPlaying);
  }, [state.ayahIndex, state.isPlaying, state.surahId, surahs, switchToSurah, verses.length]);

  const onEnded = useCallback(() => {
    if (state.repeatCurrent) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => setState((current) => ({ ...current, isPlaying: false })));
      }
      return;
    }
    moveVerse(1);
  }, [moveVerse, state.repeatCurrent]);

  const togglePlayback = useCallback(() => {
    setState((current) => ({ ...current, isPlaying: !current.isPlaying }));
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(time)) audio.currentTime = time;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState((current) => ({ ...current, playbackRate: rate }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((current) => ({ ...current, volume }));
  }, []);

  const setReciter = useCallback((reciterId: string) => {
    setState((current) => ({ ...current, currentReciterId: reciterId }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((current) => ({ ...current, repeatCurrent: !current.repeatCurrent }));
  }, []);

  const value = useMemo<AudioPlayerValue>(() => ({
    state,
    surahs,
    verses,
    currentSurah,
    currentReciter,
    dataNotice,
    isLoadingVerses,
    selectSurah,
    playSurah,
    playVerse,
    togglePlayback,
    nextVerse: () => moveVerse(1),
    previousVerse: () => moveVerse(-1),
    seek,
    setPlaybackRate,
    setVolume,
    setReciter,
    toggleRepeat,
  }), [
    state, surahs, verses, currentSurah, currentReciter, dataNotice, isLoadingVerses, selectSurah,
    playSurah, playVerse, togglePlayback, moveVerse, seek, setPlaybackRate, setVolume, setReciter, toggleRepeat,
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
