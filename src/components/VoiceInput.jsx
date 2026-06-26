import React, { useState, useRef, useEffect } from "react";
import { Mic, Speech, CircleAlert } from "lucide-react";

export default function VoiceInput({ onTranscript, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Detect standard and webkit voice recognition mechanisms
    const SpeechRecognitionAPI = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage("");
      };

      recognition.onresult = (event) => {
        const resultIndex = event.resultIndex;
        if (event.results && event.results[resultIndex]) {
          const transcript = event.results[resultIndex][0].transcript;
          if (transcript) {
            onTranscript(transcript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Web Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error === "no-speech") {
          setErrorMessage("No voice was detected. Please try speaking closer to the mic.");
        } else {
          setErrorMessage(`Speech signal error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("SpeechRecognition API is not backed by this browser's runtime environment.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const handleToggle = (e) => {
    e.preventDefault();
    if (disabled) return;
    setErrorMessage("");

    if (!recognitionRef.current) {
      setErrorMessage("Voice capture is not supported in this browser version.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Recognition already suspended", err);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition already active", err);
      }
    }
  };

  const isSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="flex flex-col items-center gap-2 select-none w-full sm:w-auto">
      <button
        id="btn-voice-capture"
        type="button"
        disabled={disabled || !isSupported}
        onClick={handleToggle}
        className={`relative w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-xs cursor-pointer border ${
          !isSupported
            ? "bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed"
            : disabled
            ? "bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed"
            : isListening
            ? "bg-rose-600 border-rose-600 text-white animate-pulse"
            : "bg-[#1E293B] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        }`}
        title={isSupported ? "Click to start/stop speaking" : "Voice input not supported in your browser"}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>🛑 Stop listening</span>
          </>
        ) : (
          <>
            <span>🎤 Tap to speak</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div id="voice-error-banner" className="flex items-center gap-1.5 mt-2 bg-rose-500/15 text-rose-400 text-xs px-2.5 py-1.5 rounded-lg border border-rose-500/20 max-w-xs text-left">
          <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
