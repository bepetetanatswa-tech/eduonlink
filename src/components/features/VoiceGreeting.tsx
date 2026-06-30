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
      if (!("speechSynthesis" in window)) return;

      const doSpeak = (voices: SpeechSynthesisVoice[]) => {
        const utter = new SpeechSynthesisUtterance(GREETING);
        utter.rate = 0.88;
        utter.pitch = 1.0;
        utter.volume = 0.9;

        const preferred =
          voices.find(
            (v) =>
              (v.name.includes("Google UK English Female") ||
                v.name.includes("Samantha") ||
                v.name.includes("Victoria") ||
                v.name.includes("Karen") ||
                v.name.includes("Daniel")) &&
              v.lang.startsWith("en")
          ) ??
          voices.find((v) => v.lang.startsWith("en-GB")) ??
          voices.find((v) => v.lang.startsWith("en")) ??
          null;

        if (preferred) utter.voice = preferred;
        sessionStorage.setItem(SESSION_KEY, "1");
        speechSynthesis.speak(utter);
      };

      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak(voices);
      } else {
        speechSynthesis.addEventListener(
          "voiceschanged",
          () => doSpeak(speechSynthesis.getVoices()),
          { once: true }
        );
      }
    };

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
