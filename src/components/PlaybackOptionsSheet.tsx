import type { RefObject } from "react";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import Sheet from "./Sheet";
import ToggleSwitch from "./ToggleSwitch";

interface PlaybackOptionsSheetProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];
const PAUSES: (0 | 2 | 4 | 6)[] = [0, 2, 4, 6];
const REPEAT_LABELS = { off: "Off", verse: "Verse", surah: "Surah" } as const;

export default function PlaybackOptionsSheet({ open, onClose, returnFocusRef }: PlaybackOptionsSheetProps) {
  const {
    state,
    verses,
    setPlaybackRate,
    toggleRepeat,
    toggleAbLoop,
    setAbStartIndex,
    setAbEndIndex,
    setRecitationPauseSeconds,
  } = useAudioPlayer();
  const abEndIndex = state.abEndIndex < 0 ? Math.max(verses.length - 1, 0) : state.abEndIndex;
  const repeatLabel = REPEAT_LABELS[state.repeatMode as keyof typeof REPEAT_LABELS] ?? state.repeatMode;

  return (
    <Sheet id="playback-options" title="Playback options" open={open} onClose={onClose} returnFocusRef={returnFocusRef}>
      <div className="sheet-section">
        <span className="sheet-field-label" id="speed-label">Speed</span>
        <div className="segmented" role="radiogroup" aria-labelledby="speed-label">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              className="segment"
              type="button"
              role="radio"
              aria-checked={state.playbackRate === speed}
              onClick={() => setPlaybackRate(speed)}
            >{speed}×</button>
          ))}
        </div>
      </div>

      <div className="sheet-section">
        <span className="sheet-field-label" id="pause-label">Pause between verses</span>
        <div className="segmented" role="radiogroup" aria-labelledby="pause-label">
          {PAUSES.map((seconds) => (
            <button
              key={seconds}
              className="segment"
              type="button"
              role="radio"
              aria-checked={state.recitationPauseSeconds === seconds}
              onClick={() => setRecitationPauseSeconds(seconds)}
            >{seconds === 0 ? "None" : `${seconds}s`}</button>
          ))}
        </div>
      </div>

      <div className="sheet-section">
        <button className="switch-row" type="button" onClick={toggleRepeat} aria-label={`Repeat mode: ${repeatLabel}. Activate to change.`}>
          <span className="switch-copy">
            <span className="switch-label">Repeat</span>
            <span className="switch-description">Tap to cycle: off, verse, surah</span>
          </span>
          <span className={`pill${state.repeatMode !== "off" ? " active" : ""}`}>{repeatLabel}</span>
        </button>

        <ToggleSwitch
          label="Enable A-B Repeat"
          description="Loop a range of verses"
          checked={state.abLoopEnabled}
          disabled={verses.length === 0}
          onChange={toggleAbLoop}
        />
        {state.abLoopEnabled && (
          <div className="ab-range" role="group" aria-label="A-B repeat range">
            <label className="ab-select">
              <span className="pill">A</span>
              <select
                aria-label="Start verse for A-B repeat"
                value={state.abStartIndex}
                onChange={(event) => setAbStartIndex(Number(event.target.value))}
              >
                {verses.map((verse, index) => (
                  <option key={verse.numberInSurah} value={index}>Verse {verse.numberInSurah}</option>
                ))}
              </select>
            </label>
            <span className="ab-arrow" aria-hidden="true">→</span>
            <label className="ab-select">
              <span className="pill">B</span>
              <select
                aria-label="End verse for A-B repeat"
                value={abEndIndex}
                onChange={(event) => setAbEndIndex(Number(event.target.value))}
              >
                {verses.map((verse, index) => (
                  <option key={verse.numberInSurah} value={index}>Verse {verse.numberInSurah}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </Sheet>
  );
}
