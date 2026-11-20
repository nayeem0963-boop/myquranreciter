import type { CSSProperties } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function AudioPlayerBar() {
  const {
    state,
    currentSurah,
    verses,
    currentReciter,
    togglePlayback,
    nextVerse,
    previousVerse,
    seek,
    setPlaybackRate,
    setVolume,
    toggleRepeat,
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
        <div className="transport-controls">
          <button
            className={`icon-button repeat-button${state.repeatCurrent ? " enabled" : ""}`}
            type="button"
            aria-label={state.repeatCurrent ? "Turn off repeat verse" : "Repeat current verse"}
            aria-pressed={state.repeatCurrent}
            onClick={toggleRepeat}
          >↻</button>
          <button className="icon-button" type="button" aria-label="Previous verse" onClick={previousVerse}>|◀</button>
          <button
            className="play-button"
            type="button"
            aria-label={state.isPlaying ? "Pause" : "Play"}
            onClick={togglePlayback}
          >{state.isPlaying ? "Ⅱ" : "▶"}</button>
          <button className="icon-button" type="button" aria-label="Next verse" onClick={nextVerse}>▶|</button>
          <label className="speed-control">
            <span className="sr-only">Playback speed</span>
            <select
              value={state.playbackRate}
              onChange={(event) => setPlaybackRate(Number(event.target.value))}
              aria-label="Playback speed"
            >
              <option value="0.75">0.75×</option>
              <option value="1">1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
            </select>
          </label>
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
        <span aria-hidden="true">◖</span>
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
    </footer>
  );
}
