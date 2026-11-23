import { getSampleVerses, RECITERS, SAMPLE_SURAHS } from "./sampleData";
import type { Ayah, QuranWord, Reciter, Surah, SurahAudio, Tafsir } from "../types";

const API_BASE = "https://api.alquran.cloud/v1";
const QURAN_COM_API_BASE = "https://api.quran.com/api/v4";
const REQUEST_TIMEOUT_MS = 6000;
const SEARCH_TIMEOUT_MS = 20000;
const WORD_REQUEST_TIMEOUT_MS = 20000;

export interface DataResult<T> {
  data: T;
  source: "api" | "sample";
  notice?: string;
}

interface ApiResponse<T> {
  code: number;
  data: T;
}

interface CloudSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

interface CloudEdition {
  ayahs: Array<{
    numberInSurah: number;
    text: string;
  }>;
}

interface CloudQuran {
  surahs: Array<{
    number: number;
    ayahs: Array<{ text: string }>;
  }>;
}

interface QuranComTafsirResponse {
  tafsir?: {
    text?: string;
    resource_name?: string;
  };
}

interface QuranComChapterWordsResponse {
  verses?: Array<{
    verse_number: number;
    words?: Array<{
      position: number;
      char_type_name: string;
      text_uthmani?: string;
      text?: string;
      translation?: { text?: string };
      transliteration?: { text?: string | null };
    }>;
  }>;
}

async function request<T>(url: string, signal?: AbortSignal, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
  });
  if (!response.ok) {
    throw new Error(`Quran data request failed (${response.status}).`);
  }
  const result = (await response.json()) as ApiResponse<T>;
  if (result.code !== 200) {
    throw new Error("The Quran data service returned an error.");
  }
  return result.data;
}

export async function fetchTranslationSearchIndex(signal?: AbortSignal): Promise<DataResult<Record<number, string>>> {
  try {
    const quran = await request<CloudQuran>(`${API_BASE}/quran/en.asad`, signal, SEARCH_TIMEOUT_MS);
    return {
      source: "api",
      data: Object.fromEntries(quran.surahs.map((surah) => [
        surah.number,
        surah.ayahs.map((ayah) => ayah.text).join(" "),
      ])),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    const sampleTranslations = Object.fromEntries(SAMPLE_SURAHS.map((surah) => [
      surah.number,
      getSampleVerses(surah.number).map((ayah) => ayah.translation).join(" "),
    ]));
    return {
      data: sampleTranslations,
      source: "sample",
      notice: "Translation search is limited to bundled sample chapters while offline.",
    };
  }
}

function tafsirHtmlToText(html: string): string {
  const withParagraphBreaks = html
    .replace(/<\/(h[1-6]|p|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const parsed = new DOMParser().parseFromString(withParagraphBreaks, "text/html");
  return (parsed.body.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchTafsir(surahNumber: number, ayahNumber: number, signal?: AbortSignal): Promise<Tafsir> {
  const response = await fetch(
    `${QURAN_COM_API_BASE}/tafsirs/169/by_ayah/${surahNumber}:${ayahNumber}`,
    {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
        : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`Tafsir request failed (${response.status}).`);
  }
  const result = await response.json() as QuranComTafsirResponse;
  if (!result.tafsir?.text) {
    throw new Error("The Tafsir service returned no commentary for this verse.");
  }
  return {
    text: tafsirHtmlToText(result.tafsir.text),
    sourceName: result.tafsir.resource_name ?? "Ibn Kathir (Abridged)",
  };
}

export async function fetchWordsBySurah(
  surahNumber: number,
  signal?: AbortSignal,
): Promise<Record<number, QuranWord[]>> {
  const response = await fetch(
    `${QURAN_COM_API_BASE}/verses/by_chapter/${surahNumber}?words=true&word_fields=text_uthmani,translation,transliteration&per_page=300`,
    {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(WORD_REQUEST_TIMEOUT_MS)])
        : AbortSignal.timeout(WORD_REQUEST_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`Word-by-word data request failed (${response.status}).`);
  }
  const result = await response.json() as QuranComChapterWordsResponse;
  if (!Array.isArray(result.verses)) {
    throw new Error("The Quran service returned no word-by-word data.");
  }
  return Object.fromEntries(result.verses.map((verse) => [
    verse.verse_number,
    (verse.words ?? [])
      .filter((word) => word.char_type_name === "word")
      .map((word) => ({
        position: word.position,
        text: word.text_uthmani ?? word.text ?? "",
        translation: word.translation?.text ?? "",
        transliteration: word.transliteration?.text ?? "",
      }))
      .filter((word) => word.text.length > 0),
  ]));
}

export async function fetchSurahs(signal?: AbortSignal): Promise<DataResult<Surah[]>> {
  try {
    const data = await request<CloudSurah[]>(`${API_BASE}/surah`, signal);
    return {
      source: "api",
      data: data.map((surah) => ({
        number: surah.number,
        nameArabic: surah.name,
        nameTransliteration: surah.englishName,
        nameEnglish: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      })),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return {
      data: SAMPLE_SURAHS,
      source: "sample",
      notice: "Showing the bundled sample chapters because the Quran data service is unavailable.",
    };
  }
}

export async function fetchVerses(surahId: number, signal?: AbortSignal): Promise<DataResult<Ayah[]>> {
  try {
    const editions = await request<CloudEdition[]>(
      `${API_BASE}/surah/${surahId}/editions/quran-uthmani,en.asad,en.transliteration`,
      signal,
    );
    const [arabic, translation, transliteration] = editions;
    if (!arabic || !translation || arabic.ayahs.length !== translation.ayahs.length) {
      throw new Error("The Quran data service returned an incomplete chapter.");
    }
    return {
      source: "api",
      data: arabic.ayahs.map((ayah, index) => ({
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        translation: translation.ayahs[index].text,
        transliteration: transliteration?.ayahs[index]?.text,
      })),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    const sample = getSampleVerses(surahId);
    return {
      data: sample,
      source: "sample",
      notice: sample.length > 0
        ? "Showing bundled sample verses because the Quran data service is unavailable."
        : "This chapter needs an internet connection to load; the sample data does not include it.",
    };
  }
}

export function getReciters(): Reciter[] {
  return RECITERS;
}

export function getVerseAudioUrl(reciter: Reciter, surahNumber: number, ayahNumber: number): string {
  const surah = String(surahNumber).padStart(3, "0");
  const ayah = String(ayahNumber).padStart(3, "0");
  return `https://everyayah.com/data/${reciter.audioDirectory}/${surah}${ayah}.mp3`;
}

interface ChapterRecitationResponse {
  audio_file?: {
    audio_url?: string;
    timestamps?: Array<{ verse_key?: string; timestamp_from?: number; timestamp_to?: number }>;
  };
}

/**
 * One continuous recording per surah plus per-verse timestamps. Playing a single file lets the
 * phone keep reciting with the screen locked (no JavaScript needed between verses).
 * Returns null when unavailable or inconsistent, so callers fall back to per-verse audio.
 */
export async function fetchSurahAudio(
  reciter: Reciter,
  surahNumber: number,
  verseCount: number,
  signal?: AbortSignal,
): Promise<SurahAudio | null> {
  if (!reciter.quranComRecitationId || verseCount <= 0) return null;
  try {
    const response = await fetch(
      `${QURAN_COM_API_BASE}/chapter_recitations/${reciter.quranComRecitationId}/${surahNumber}?segments=true`,
      { signal },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as ChapterRecitationResponse;
    const file = payload.audio_file;
    if (!file?.audio_url || !file.timestamps) return null;
    const url = file.audio_url.startsWith("http")
      ? file.audio_url
      : `https://download.quranicaudio.com/${file.audio_url.replace(/^\/+/, "")}`;
    const startsMs: number[] = new Array(verseCount).fill(-1);
    const endsMs: number[] = new Array(verseCount).fill(-1);
    for (const stamp of file.timestamps) {
      const [chapter, verse] = (stamp.verse_key ?? "").split(":").map(Number);
      if (chapter !== surahNumber || !Number.isInteger(verse) || verse < 1 || verse > verseCount) continue;
      if (typeof stamp.timestamp_from !== "number" || typeof stamp.timestamp_to !== "number") continue;
      startsMs[verse - 1] = stamp.timestamp_from;
      endsMs[verse - 1] = stamp.timestamp_to;
    }
    const valid = startsMs.every((value, index) => value >= 0 && endsMs[index] > value && (index === 0 || value >= startsMs[index - 1]));
    if (!valid) return null;
    return { surahId: surahNumber, reciterId: reciter.id, url, startsMs, endsMs };
  } catch {
    return null;
  }
}
