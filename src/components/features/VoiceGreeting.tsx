"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "voa_voice_greeted";
const MUTE_KEY = "voa_voice_muted";
const GREETING = "Welcome to Vavhimi Online Academy. Zimbabwe's future learns here.";

export default function VoiceGreeting() {
  const played = useRef(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [muted, setMuted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMute = sessionStorage.getItem(MUTE_KEY) === "1";
    setMuted(storedMute);

    if (sessionStorage.getItem(SESSION_KEY) || storedMute) {
      setShown(true);
      return;
    }

    const speak = () => {
      if (played.current) return;
      played.current = true;
      if (!("speechSynthesis" in window)) {
        setShown(true);
        return;
      }

      const doSpeak = (voices: SpeechSynthesisVoice[]) => {
        const utter = new SpeechSynthesisUtterance(GREETING);
        utter.rate = 0.88;
        utter.pitch = 1.0;
        utter.volume = 0.88;

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
        utter.onerror = () => { /* fail silently */ };

        utterRef.current = utter;
        sessionStorage.setItem(SESSION_KEY, "1");

        try {
          speechSynthesis.speak(utter);
        } catch {
          /* fail silently */
        }

        setShown(true);
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

  const handleToggle = () => {
    if (!muted) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { speechSynthesis.cancel(); } catch { /* ignore */ }
      }
      sessionStorage.setItem(MUTE_KEY, "1");
      setMuted(true);
    } else {
      sessionStorage.removeItem(MUTE_KEY);
      setMuted(false);
    }
  };

  if (!shown) return null;

  return (
    <button
      onClick={handleToggle}
      aria-label={muted ? "Unmute welcome greeting" : "Mute welcome greeting"}
      title={muted ? "Unmute greeting" : "Mute greeting"}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 60,
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        background: "rgba(13,15,26,0.85)",
        border: "1px solid rgba(77,127,255,0.25)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        color: muted ? "#4A5170" : "#4D7FFF",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(77,127,255,0.5)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(13,15,26,0.95)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(77,127,255,0.25)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(13,15,26,0.85)";
      }}
    >
      {muted ? (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-4.243-9.757a7 7 0 000 9.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
    </button>
  );
}
