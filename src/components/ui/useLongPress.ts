"use client";

import { useRef } from "react";

interface LongPressHandlers {
  onContextMenu: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

/**
 * Right-click on desktop, long-press (450ms, cancelled by scroll/move) on
 * touch — both call `onTrigger` with the client coordinates to open at.
 */
export function useLongPress(onTrigger: (x: number, y: number) => void): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const moved = useRef(false);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onTrigger(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    moved.current = false;
    const touch = e.touches[0];
    timer.current = setTimeout(() => {
      if (!moved.current) {
        if (navigator.vibrate) navigator.vibrate(10);
        onTrigger(touch.clientX, touch.clientY);
      }
    }, 450);
  };

  const onTouchMove = () => {
    moved.current = true;
    if (timer.current) clearTimeout(timer.current);
  };

  const onTouchEnd = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return { onContextMenu, onTouchStart, onTouchEnd, onTouchMove };
}
