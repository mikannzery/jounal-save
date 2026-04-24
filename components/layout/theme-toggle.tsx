"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

type ThemeMode = "dark" | "light";

function getThemeSnapshot(): ThemeMode {
  return window.localStorage.getItem("clip-memo-theme") === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function subscribe(callback: () => void) {
  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener("clip-memo-theme-change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("clip-memo-theme-change", handleChange);
  };
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  function toggleTheme() {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextMode;
    window.localStorage.setItem("clip-memo-theme", nextMode);
    window.dispatchEvent(new Event("clip-memo-theme-change"));
  }

  const nextModeLabel = mode === "dark" ? "ライトモードへ切り替え" : "ダークモードへ切り替え";

  return (
    <Button
      aria-label={nextModeLabel}
      className="h-12 w-12 border-transparent bg-transparent text-white hover:border-white hover:bg-white hover:text-black"
      onClick={toggleTheme}
      size="icon"
      title={nextModeLabel}
      type="button"
      variant="ghost"
    >
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
