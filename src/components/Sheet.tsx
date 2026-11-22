import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  /** Element that opened the sheet; focus returns here on close. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on mobile, anchored popover card on larger screens.
 * Always mounted so the slide transition can run; hidden via `visibility`.
 */
export default function Sheet({ id, title, open, onClose, returnFocusRef, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      document.body.classList.add("sheet-open");
      const frame = window.requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>(".sheet-close")?.focus();
      });
      return () => {
        window.cancelAnimationFrame(frame);
        document.body.classList.remove("sheet-open");
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusRef?.current?.focus();
    }
    return undefined;
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Portal to <body> so ancestors with transforms/filters (e.g. the player bar) cannot clip or re-stack the sheet.
  return createPortal(
    <div className={`sheet-root${open ? " open" : ""}`}>
      <button
        className="sheet-backdrop"
        type="button"
        tabIndex={-1}
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={id}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button className="sheet-close" type="button" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
