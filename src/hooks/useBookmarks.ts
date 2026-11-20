import { useCallback, useEffect, useState } from "react";
import type { Bookmark } from "../types";

const STORAGE_KEY = "myquranreciter.bookmarks";

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== "object") return false;
  const bookmark = value as Partial<Bookmark>;
  return typeof bookmark.surahId === "number" &&
    Number.isInteger(bookmark.surahId) &&
    bookmark.surahId >= 1 &&
    bookmark.surahId <= 114 &&
    typeof bookmark.verseNumber === "number" &&
    Number.isInteger(bookmark.verseNumber) &&
    bookmark.verseNumber >= 1 &&
    typeof bookmark.surahTitle === "string" &&
    typeof bookmark.snippet === "string";
}

function readBookmarks(): Bookmark[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isBookmark) : [];
  } catch (error) {
    console.error("Unable to read saved Quran bookmarks.", error);
    return [];
  }
}

function bookmarkKey(bookmark: Pick<Bookmark, "surahId" | "verseNumber">): string {
  return `${bookmark.surahId}:${bookmark.verseNumber}`;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(readBookmarks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Unable to save Quran bookmarks.", error);
    }
  }, [bookmarks]);

  const toggleBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks((current) => current.some((saved) => bookmarkKey(saved) === bookmarkKey(bookmark))
      ? current.filter((saved) => bookmarkKey(saved) !== bookmarkKey(bookmark))
      : [bookmark, ...current]);
  }, []);

  const removeBookmark = useCallback((surahId: number, verseNumber: number) => {
    setBookmarks((current) => current.filter((bookmark) =>
      bookmark.surahId !== surahId || bookmark.verseNumber !== verseNumber,
    ));
  }, []);

  return { bookmarks, toggleBookmark, removeBookmark };
}
