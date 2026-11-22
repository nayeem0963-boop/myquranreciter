import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import PlaybackOptionsSheet from "./PlaybackOptionsSheet";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function AudioPlayerBar() {
  const [areOptionsOpen, setAreOptionsOpen] = useState(false);
  const optionsToggleRef = useRef<HTMLButtonElement>(null);
  const {
    state,
    currentSurah,
    verses,
    currentReciter,
    togglePlayback,
    nextVerse,
    previousVerse,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();
  const activeVerse = verses[state.ayahIndex];
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <footer className="player-bar" aria-label="Audio player">
      <div className="now-playing">
        <span className="player-art" aria-hidden="true">۞</span>
        <div className="now-playing-copy">
          <strong>{currentSurah?.nameTransliteration ?? "Select a Surah"}</strong>
          <span>
            {activeVerse ? `Verse ${activeVerse.numberInSurah}` : "Ready when you are"}
            {currentReciter ? ` · ${currentReciter.name}` : ""}
          </span>
        </div>
      </div>

      <div className="player-center">
        <div className="player-main-row">
          <div className="transport-controls">
            <button className="icon-button" type="button" aria-label="Previous verse" onClick={previousVerse}>|◀</button>
            <button
              className="play-button"
              type="button"
              aria-label={state.isPlaying ? "Pause" : "Play"}
              onClick={togglePlayback}
            >{state.isPlaying ? "Ⅱ" : "▶"}</button>
            <button className="icon-button" type="button" aria-label="Next verse" onClick={nextVerse}>▶|</button>
          </div>
          <button
            ref={optionsToggleRef}
            className="mobile-options-toggle"
            type="button"
            aria-label="More playback options"
            aria-haspopup="dialog"
            aria-expanded={areOptionsOpen}
            aria-controls="playback-options"
            onClick={() => setAreOptionsOpen(true)}
          >•••</button>
        </div>
        <div className="progress-row">
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
      </div>

      <label className="volume-control">
        <button
          className={`icon-button mute-button${state.isMuted ? " enabled" : ""}`}
          type="button"
          aria-label={state.isMuted ? "Unmute" : "Mute"}
          aria-pressed={state.isMuted}
          onClick={toggleMute}
        >{state.isMuted ? "×" : "◖"}</button>
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.volume}
          aria-label="Volume"
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
      <PlaybackOptionsSheet
        open={areOptionsOpen}
        onClose={() => setAreOptionsOpen(false)}
        returnFocusRef={optionsToggleRef}
      />
    </footer>
  );
}
