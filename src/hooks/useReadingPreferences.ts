import { useEffect, useState } from "react";

export type ReadingTheme = "light" | "warm" | "dark";

interface ReadingPreferences {
  arabicFontSize: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  theme: ReadingTheme;
  setArabicFontSize: (size: number) => void;
  toggleTranslation: () => void;
  toggleTransliteration: () => void;
  setTheme: (theme: ReadingTheme) => void;
}

interface SavedReadingPreferences {
  arabicFontSize?: unknown;
  showTranslation?: unknown;
  showTransliteration?: unknown;
  theme?: unknown;
}

const STORAGE_KEY = "myquranreciter.reading";
const DEFAULT_PREFERENCES = {
  arabicFontSize: 29,
  showTranslation: true,
  showTransliteration: false,
  theme: "dark" as ReadingTheme,
};

function readPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_PREFERENCES;
    const preferences = JSON.parse(saved) as SavedReadingPreferences;
    return {
      arabicFontSize: typeof preferences.arabicFontSize === "number" &&
        preferences.arabicFontSize >= 22 && preferences.arabicFontSize <= 40
        ? preferences.arabicFontSize
        : DEFAULT_PREFERENCES.arabicFontSize,
      showTranslation: typeof preferences.showTranslation === "boolean"
        ? preferences.showTranslation
        : DEFAULT_PREFERENCES.showTranslation,
      showTransliteration: typeof preferences.showTransliteration === "boolean"
        ? preferences.showTransliteration
        : DEFAULT_PREFERENCES.showTransliteration,
      theme: preferences.theme === "warm" || preferences.theme === "dark" || preferences.theme === "light"
        ? preferences.theme
        : DEFAULT_PREFERENCES.theme,
    };
  } catch (error) {
    console.error("Unable to read saved reading preferences.", error);
    return DEFAULT_PREFERENCES;
  }
}

export function useReadingPreferences(): ReadingPreferences {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Unable to save reading preferences.", error);
    }
  }, [preferences]);

  return {
    ...preferences,
    setArabicFontSize: (arabicFontSize) => setPreferences((current) => ({ ...current, arabicFontSize })),
    toggleTranslation: () => setPreferences((current) => ({
      ...current,
      showTranslation: !current.showTranslation,
    })),
    toggleTransliteration: () => setPreferences((current) => ({
      ...current,
      showTransliteration: !current.showTransliteration,
    })),
    setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
  };
}
