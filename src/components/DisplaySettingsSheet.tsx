import type { RefObject } from "react";
import type { ReadingTheme } from "../hooks/useReadingPreferences";
import Sheet from "./Sheet";
import ToggleSwitch from "./ToggleSwitch";

interface DisplaySettingsSheetProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  arabicFontSize: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  theme: ReadingTheme;
  onArabicFontSizeChange: (size: number) => void;
  onToggleTranslation: () => void;
  onToggleTransliteration: () => void;
  onThemeChange: (theme: ReadingTheme) => void;
}

const THEMES: { value: ReadingTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "warm", label: "Warm" },
  { value: "dark", label: "Dark" },
];

export default function DisplaySettingsSheet({
  open,
  onClose,
  returnFocusRef,
  arabicFontSize,
  showTranslation,
  showTransliteration,
  theme,
  onArabicFontSizeChange,
  onToggleTranslation,
  onToggleTransliteration,
  onThemeChange,
}: DisplaySettingsSheetProps) {
  return (
    <Sheet id="display-settings" title="Display settings" open={open} onClose={onClose} returnFocusRef={returnFocusRef}>
      <div className="sheet-section">
        <label className="sheet-field" htmlFor="arabic-size">
          <span className="sheet-field-label">Arabic text size</span>
          <output htmlFor="arabic-size" className="sheet-value">{arabicFontSize}px</output>
        </label>
        <div className="size-slider-row">
          <span className="size-sample small" lang="ar" aria-hidden="true">ع</span>
          <input
            id="arabic-size"
            className="range-input"
            type="range"
            min="22"
            max="40"
            value={arabicFontSize}
            onChange={(event) => onArabicFontSizeChange(Number(event.target.value))}
          />
          <span className="size-sample large" lang="ar" aria-hidden="true">ع</span>
        </div>
      </div>

      <div className="sheet-section">
        <ToggleSwitch label="Translation" description="English meaning under each verse" checked={showTranslation} onChange={onToggleTranslation} />
        <ToggleSwitch label="Transliteration" description="Latin pronunciation guide" checked={showTransliteration} onChange={onToggleTransliteration} />
      </div>

      <div className="sheet-section">
        <span className="sheet-field-label" id="reading-mode-label">Reading mode</span>
        <div className="segmented" role="radiogroup" aria-labelledby="reading-mode-label">
          {THEMES.map((option) => (
            <button
              key={option.value}
              className="segment"
              type="button"
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => onThemeChange(option.value)}
            >{option.label}</button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
