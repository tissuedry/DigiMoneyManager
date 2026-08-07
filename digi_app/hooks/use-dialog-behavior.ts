"use client";

import { useEffect } from "react";

interface DialogBehaviorOptions {
  lockScroll?: boolean;
}

export function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  { lockScroll = true }: DialogBehaviorOptions = {}
) {
  useEffect(() => {
    if (!open) return;

    if (lockScroll) document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (lockScroll) document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, lockScroll]);
}
