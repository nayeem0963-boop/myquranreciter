import type { Ayah, Reciter, Surah } from "../types";

export const SAMPLE_SURAHS: Surah[] = [
  {
    number: 1,
    nameArabic: "الفَاتِحَة",
    nameTransliteration: "Al-Fatihah",
    nameEnglish: "The Opening",
    numberOfAyahs: 7,
    revelationType: "Meccan",
  },
  {
    number: 112,
    nameArabic: "الإِخْلَاص",
    nameTransliteration: "Al-Ikhlas",
    nameEnglish: "Sincerity",
    numberOfAyahs: 4,
    revelationType: "Meccan",
  },
  {
    number: 113,
    nameArabic: "الفَلَق",
    nameTransliteration: "Al-Falaq",
    nameEnglish: "The Daybreak",
    numberOfAyahs: 5,
    revelationType: "Meccan",
  },
  {
    number: 114,
    nameArabic: "النَّاس",
    nameTransliteration: "An-Nas",
    nameEnglish: "Mankind",
    numberOfAyahs: 6,
    revelationType: "Meccan",
  },
];

export const SAMPLE_VERSES: Record<number, Ayah[]> = {
  1: [
    { numberInSurah: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In the name of God, the Most Gracious, the Dispenser of Grace:" },
    { numberInSurah: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to God alone, the Sustainer of all the worlds," },
    { numberInSurah: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ", translation: "the Most Gracious, the Dispenser of Grace," },
    { numberInSurah: 4, text: "مَالِكِ يَوْمِ الدِّينِ", translation: "Lord of the Day of Judgment!" },
    { numberInSurah: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "Thee alone do we worship; and unto Thee alone do we turn for aid." },
    { numberInSurah: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translation: "Guide us the straight way—" },
    { numberInSurah: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", translation: "the way of those upon whom Thou hast bestowed Thy blessings, not those who have been condemned, nor those who go astray!" },
  ],
  112: [
    { numberInSurah: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Say: He is the One God:" },
    { numberInSurah: 2, text: "اللَّهُ الصَّمَدُ", translation: "God the Eternal, the Uncaused Cause of All Being." },
    { numberInSurah: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ", translation: "He begets not, and neither is He begotten;" },
    { numberInSurah: 4, text: "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ", translation: "and there is nothing that could be compared with Him." },
  ],
  113: [
    { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", translation: "Say: I seek refuge with the Sustainer of the rising dawn," },
    { numberInSurah: 2, text: "مِنْ شَرِّ مَا خَلَقَ", translation: "from the evil of anything that He has created," },
    { numberInSurah: 3, text: "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ", translation: "and from the evil of the darkness whenever it descends," },
    { numberInSurah: 4, text: "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", translation: "and from the evil of all human beings bent on occult endeavours," },
    { numberInSurah: 5, text: "وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ", translation: "and from the evil of the envious when he envies." },
  ],
  114: [
    { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", translation: "Say: I seek refuge with the Sustainer of mankind," },
    { numberInSurah: 2, text: "مَلِكِ النَّاسِ", translation: "the Sovereign of mankind," },
    { numberInSurah: 3, text: "إِلَٰهِ النَّاسِ", translation: "the God of mankind," },
    { numberInSurah: 4, text: "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", translation: "from the evil of the whispering, elusive tempter" },
    { numberInSurah: 5, text: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", translation: "who whispers in the hearts of men—" },
    { numberInSurah: 6, text: "مِنَ الْجِنَّةِ وَالنَّاسِ", translation: "from all [temptation to evil by] invisible forces as well as men." },
  ],
};

export const RECITERS: Reciter[] = [
  { id: "alafasy", name: "Mishary Rashid Alafasy", country: "Kuwait", audioDirectory: "Alafasy_128kbps" },
  { id: "husary", name: "Mahmoud Khalil Al-Husary", country: "Egypt", audioDirectory: "Husary_128kbps" },
  { id: "abdulbasit", name: "Abdul Basit Abdul Samad", country: "Egypt", audioDirectory: "Abdul_Basit_Murattal_192kbps" },
];

export function getSampleVerses(surahId: number): Ayah[] {
  return SAMPLE_VERSES[surahId] ?? [];
}
