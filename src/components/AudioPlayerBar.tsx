import type { CSSProperties } from "react";
import { useState } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function AudioPlayerBar() {
  const [areOptionsOpen, setAreOptionsOpen] = useState(false);
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
    toggleMute,
    toggleAbLoop,
    setAbStartIndex,
    setAbEndIndex,
    setRecitationPauseSeconds,
  } = useAudioPlayer();
  const activeVerse = verses[state.ayahIndex];
  const abEndIndex = state.abEndIndex < 0 ? Math.max(verses.length - 1, 0) : state.abEndIndex;
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
            className="mobile-options-toggle"
            type="button"
            aria-label="More playback options"
            aria-expanded={areOptionsOpen}
            aria-controls="player-options"
            onClick={() => setAreOptionsOpen((open) => !open)}
          >•••</button>
        </div>
        <div
          id="player-options"
          className={`player-options-row${areOptionsOpen ? " expanded" : ""}`}
        >
          <button
            className={`icon-button repeat-button${state.repeatMode !== "off" ? " enabled" : ""}`}
            type="button"
            aria-label={`Repeat mode: ${state.repeatMode}. Activate to change repeat mode.`}
            title={`Repeat ${state.repeatMode}`}
            aria-pressed={state.repeatMode !== "off"}
            onClick={toggleRepeat}
          >↻{state.repeatMode === "verse" ? "¹" : state.repeatMode === "surah" ? "∞" : ""}</button>
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
          <div className="ab-loop-controls" aria-label="A-B range loop controls">
            <button
              className={`ab-loop-toggle${state.abLoopEnabled ? " enabled" : ""}`}
              type="button"
              aria-label={state.abLoopEnabled ? "Turn off A-B loop" : "Turn on A-B loop"}
              aria-pressed={state.abLoopEnabled}
              disabled={verses.length === 0}
              onClick={toggleAbLoop}
            >A–B</button>
            <label>
              <span>A</span>
              <select
                aria-label="Start verse for A-B loop"
                value={state.abStartIndex}
                disabled={verses.length === 0}
                onChange={(event) => setAbStartIndex(Number(event.target.value))}
              >
                {verses.map((verse, index) => (
                  <option key={verse.numberInSurah} value={index}>{verse.numberInSurah}</option>
                ))}
              </select>
            </label>
            <span aria-hidden="true">→</span>
            <label>
              <span>B</span>
              <select
                aria-label="End verse for A-B loop"
                value={abEndIndex}
                disabled={verses.length === 0}
                onChange={(event) => setAbEndIndex(Number(event.target.value))}
              >
                {verses.map((verse, index) => (
                  <option key={verse.numberInSurah} value={index}>{verse.numberInSurah}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="recitation-pause-control">
            <span>Recitation pause</span>
            <select
              aria-label="Recitation pause"
              value={state.recitationPauseSeconds}
              onChange={(event) => {
                const seconds = Number(event.target.value);
                if (seconds === 0 || seconds === 2 || seconds === 4 || seconds === 6) {
                  setRecitationPauseSeconds(seconds);
                }
              }}
            >
              <option value="0">None</option>
              <option value="2">2s</option>
              <option value="4">4s</option>
              <option value="6">6s</option>
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
    </footer>
  );
}
