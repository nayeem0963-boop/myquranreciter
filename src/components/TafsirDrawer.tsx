import { useEffect, useState } from "react";
import type { Ayah, Surah, Tafsir } from "../types";
import { fetchTafsir } from "../services/quranApi";

interface TafsirDrawerProps {
  surah: Surah;
  verse: Ayah;
  onClose: () => void;
}

type TafsirState =
  | { status: "loading" }
  | { status: "loaded"; tafsir: Tafsir }
  | { status: "error"; message: string };

export default function TafsirDrawer({ surah, verse, onClose }: TafsirDrawerProps) {
  const [tafsirState, setTafsirState] = useState<TafsirState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setTafsirState({ status: "loading" });
    fetchTafsir(surah.number, verse.numberInSurah, controller.signal)
      .then((tafsir) => setTafsirState({ status: "loaded", tafsir }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTafsirState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load Tafsir commentary.",
          });
        }
      });

    return () => controller.abort();
  }, [retryCount, surah.number, verse.numberInSurah]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="tafsir-overlay" role="presentation" onClick={onClose}>
      <aside
        className="tafsir-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tafsir-title"
        aria-busy={tafsirState.status === "loading"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tafsir-drawer-heading">
          <div>
            <p className="eyebrow">VERSE COMMENTARY</p>
            <h2 id="tafsir-title">{surah.nameTransliteration} · Verse {verse.numberInSurah}</h2>
          </div>
          <button className="tafsir-close" type="button" aria-label="Close Tafsir" onClick={onClose}>×</button>
        </div>
        <p className="tafsir-verse" lang="ar" dir="rtl">{verse.text}</p>
        {tafsirState.status === "loading" ? (
          <p className="tafsir-status" role="status">Loading commentary…</p>
        ) : tafsirState.status === "error" ? (
          <div className="tafsir-error" role="alert">
            <p>{tafsirState.message}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
          </div>
        ) : (
          <>
            <div className="tafsir-copy">{tafsirState.tafsir.text}</div>
            <p className="tafsir-source">Source: {tafsirState.tafsir.sourceName} · Quran.com</p>
          </>
        )}
      </aside>
    </div>
  );
}
