"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "voa_voice_greeted";
const GREETING = "Welcome to Vavhimi Online Academy. Zimbabwe's future learns here.";

export default function VoiceGreeting() {
  const played = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const speak = () => {
      if (played.current) return;
      played.current = true;

      // Try custom audio file first, fall back to Web Speech API
      const audio = new window.Audio("/audio/greeting.mp3");
      audio.onloadeddata = () => {
        audio.play().catch(() => fallbackToSpeechAPI());
        sessionStorage.setItem(SESSION_KEY, "1");
      };
      audio.onerror = () => fallbackToSpeechAPI();
      audio.load();
    };

    const fallbackToSpeechAPI = () => {
      if (!("speechSynthesis" in window)) return;
      const utter = new SpeechSynthesisUtterance(GREETING);
      utter.rate = 0.88;
      utter.pitch = 1.0;
      utter.volume = 0.85;

      // Prefer a clear English voice
      const pickVoice = () => {
        const voices = speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            (v.name.includes("Google UK English Female") ||
              v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Karen") ||
              v.name.includes("Daniel")) &&
            v.lang.startsWith("en")
        ) ?? voices.find((v) => v.lang.startsWith("en-GB")) ?? null;
        if (preferred) utter.voice = preferred;
      };

      if (speechSynthesis.getVoices().length > 0) {
        pickVoice();
      } else {
        speechSynthesis.addEventListener("voiceschanged", pickVoice, { once: true });
      }

      sessionStorage.setItem(SESSION_KEY, "1");
      speechSynthesis.speak(utter);
    };

    // Trigger on first meaningful interaction — browsers block autoplay without a gesture
    const firstInteraction = () => {
      speak();
      window.removeEventListener("click", firstInteraction);
      window.removeEventListener("touchstart", firstInteraction);
      window.removeEventListener("scroll", firstInteraction);
      window.removeEventListener("keydown", firstInteraction);
    };

    window.addEventListener("click", firstInteraction, { passive: true });
    window.addEventListener("touchstart", firstInteraction, { passive: true });
    window.addEventListener("scroll", firstInteraction, { passive: true });
    window.addEventListener("keydown", firstInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", firstInteraction);
      window.removeEventListener("touchstart", firstInteraction);
      window.removeEventListener("scroll", firstInteraction);
      window.removeEventListener("keydown", firstInteraction);
    };
  }, []);

  return null;
}
