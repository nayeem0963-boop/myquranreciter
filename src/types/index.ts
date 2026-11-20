export interface Surah {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface Ayah {
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration?: string;
  words?: QuranWord[];
}

export interface QuranWord {
  position: number;
  text: string;
  translation: string;
  transliteration: string;
}

export interface Bookmark {
  surahId: number;
  verseNumber: number;
  surahTitle: string;
  snippet: string;
}

export interface Reciter {
  id: string;
  name: string;
  country: string;
  audioDirectory: string;
}

export interface PlaybackState {
  surahId: number;
  ayahIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  repeatMode: "off" | "verse" | "surah";
  currentReciterId: string;
  isMuted: boolean;
  abLoopEnabled: boolean;
  abStartIndex: number;
  abEndIndex: number;
  recitationPauseSeconds: 0 | 2 | 4 | 6;
}

export interface Tafsir {
  text: string;
  sourceName: string;
}
