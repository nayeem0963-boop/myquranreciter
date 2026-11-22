import type { CSSProperties, RefObject } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { formatTime } from "../utils/formatTime";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon } from "./Icons";
import Sheet from "./Sheet";

interface FullPlayerSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenOptions: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const REPEAT_LABELS: Record<string, string> = { off: "Off", verse: "Verse", surah: "Surah" };

export default function FullPlayerSheet({ open, onClose, onOpenOptions, returnFocusRef }: FullPlayerSheetProps) {
  const { state, currentSurah, currentReciter, verses, togglePlayback, previousVerse, nextVerse, seek, toggleRepeat } =
    useAudioPlayer();
  const verse = verses[state.ayahIndex];
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const repeatLabel = REPEAT_LABELS[state.repeatMode] ?? state.repeatMode;

  return (
    <Sheet id="full-player" title="Now playing" open={open} onClose={onClose} returnFocusRef={returnFocusRef}>
      <div className="full-player">
        <div className="full-player-meta">
          <strong>{currentSurah?.nameTransliteration ?? "Select a Surah"}</strong>
          <span>
            {verse ? `Verse ${verse.numberInSurah}` : "Ready when you are"}
            {currentReciter ? ` · ${currentReciter.name}` : ""}
          </span>
        </div>

        {verse && (
          <div className="full-player-verse">
            <p lang="ar" dir="rtl">{verse.text}</p>
            {verse.translation && <p className="full-player-translation" lang="en">{verse.translation}</p>}
          </div>
        )}

        <div className="progress-row full-player-progress">
          <span>{formatTime(state.currentTime)}</span>
          <input
            className="progress-slider"
            type="range"
            min="0"
            max={state.duration || 0}
            step="0.1"
            value={state.currentTime}
            style={{ "--progress": `${progress}%` } as CSSProperties}
            aria-label="Seek audio"
            onChange={(event) => seek(Number(event.target.value))}
          />
          <span>{formatTime(state.duration)}</span>
        </div>

        <div className="full-player-controls">
          <button
            className={`pill-button${state.repeatMode !== "off" ? " active" : ""}`}
            type="button"
            aria-label={`Repeat mode: ${repeatLabel}. Activate to change.`}
            onClick={toggleRepeat}
          ><RepeatIcon size={16} /> {repeatLabel}</button>
          <button className="full-player-skip" type="button" aria-label="Previous verse" onClick={previousVerse}><PrevIcon size={20} /></button>
          <button
            className="full-player-play"
            type="button"
            aria-label={state.isPlaying ? "Pause" : "Play"}
            onClick={togglePlayback}
          >{state.isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}</button>
          <button className="full-player-skip" type="button" aria-label="Next verse" onClick={nextVerse}><NextIcon size={20} /></button>
          <button className="pill-button" type="button" aria-haspopup="dialog" onClick={onOpenOptions}>More</button>
        </div>
      </div>
    </Sheet>
  );
}
