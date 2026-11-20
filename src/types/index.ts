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
  repeatCurrent: boolean;
  currentReciterId: string;
}
