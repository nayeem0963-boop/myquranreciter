import type { Reciter } from "../types";

interface ReciterSelectorProps {
  reciters: Reciter[];
  selectedReciterId: string;
  onChange: (reciterId: string) => void;
}

export default function ReciterSelector({ reciters, selectedReciterId, onChange }: ReciterSelectorProps) {
  return (
    <label className="reciter-select">
      <span className="reciter-icon" aria-hidden="true">♫</span>
      <span className="sr-only">Choose reciter</span>
      <select value={selectedReciterId} onChange={(event) => onChange(event.target.value)}>
        {reciters.map((reciter) => (
          <option key={reciter.id} value={reciter.id}>
            {reciter.name} · {reciter.country}
          </option>
        ))}
      </select>
      <span className="select-chevron" aria-hidden="true">⌄</span>
    </label>
  );
}
