import { getSampleVerses, RECITERS, SAMPLE_SURAHS } from "./sampleData";
import type { Ayah, Reciter, Surah } from "../types";

const API_BASE = "https://api.alquran.cloud/v1";
const REQUEST_TIMEOUT_MS = 6000;

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

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
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
      `${API_BASE}/surah/${surahId}/editions/quran-uthmani,en.asad`,
      signal,
    );
    const [arabic, translation] = editions;
    if (!arabic || !translation || arabic.ayahs.length !== translation.ayahs.length) {
      throw new Error("The Quran data service returned an incomplete chapter.");
    }
    return {
      source: "api",
      data: arabic.ayahs.map((ayah, index) => ({
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        translation: translation.ayahs[index].text,
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
