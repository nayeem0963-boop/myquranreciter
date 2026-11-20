# myquranreciter

A calm, responsive Quran reading and recitation app built with React, TypeScript, and Vite. Arabic text is rendered right-to-left, with verse highlighting, translations, reciter selection, and a persistent audio player.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```bash
npm run build
npm run preview
```

## App structure

- `src/types/` — Quran and playback domain types.
- `src/services/` — Al-Quran Cloud client, EveryAyah audio URL builder, and bundled sample chapters.
- `src/context/AudioPlayerContext.tsx` — shared HTML audio element and playback controls/state.
- `src/components/` — Surah search, reciter selector, Quran reader, and fixed audio bar.
- `src/App.tsx` — app layout, data loading, and keyboard shortcut.

The app renders bundled sample chapters immediately, then attempts to load the full Surah list and chapter text from Al-Quran Cloud. If the service is unreachable, available sample text remains usable and a notice explains the fallback. Audio is streamed from EveryAyah when playback is started, so an internet connection is needed for recitation audio.

Press **Space** to play or pause when focus is not in an input, button, or selector. Choose a verse to start playback there; playback advances through the chapter. The player also supports seeking, volume, speed, repeat-current-verse, and previous/next verse navigation.
