"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, speak } from "@/lib/client";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import type { Scan } from "@/lib/types";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function ElderModePage() {
  const router = useRouter();
  const { me } = useFamily();
  const { setLang } = useI18n();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultScan, setResultScan] = useState<Scan | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Force Hindi language mode for Elder Mode
    setLang("hi");

    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "hi-IN";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error !== "no-speech") {
            toast.error("आवाज़ नहीं पहचान सके, कृपया फिर से बोलें (Could not recognize speech)");
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [setLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("आपके ब्राउज़र में आवाज़ पहचान सुविधा उपलब्ध नहीं है (Speech recognition not supported in this browser)");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setResultScan(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const analyzeSpokenText = async () => {
    if (!transcript.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ scan: Scan }>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          text: transcript,
          language: "hi",
          country: me?.country || "IN",
        }),
      });

      setResultScan(res.scan);

      // Auto read aloud in Hindi immediately!
      const levelHindi =
        res.scan.level === "safe"
          ? "यह संदेश सुरक्षित है।"
          : res.scan.level === "careful"
          ? "ध्यान दें! इस संदेश में सावधानी बरतें।"
          : "सावधान! यह एक ख़तरनाक ठगी का संदेश है।";

      const spokenSummary = `${levelHindi} ${res.scan.verdict.summary}। ${res.scan.verdict.whatToDoNow.join("। ")}`;
      speak(spokenSummary, "hi");

    } catch (e) {
      toast.error(e instanceof Error ? e.message : "जाँच नहीं हो सकी (Analysis failed)");
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setTranscript("");
    setResultScan(null);
    setIsListening(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-4 px-2 space-y-6">
      {/* Top Bar for Elder Mode */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl flex items-center gap-2 text-sm font-semibold"
          onClick={() => router.push("/app")}
        >
          <ArrowLeft className="size-4" />
          <span>सामान्य मोड (Normal Mode)</span>
        </Button>

        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/15 text-brand text-xs font-bold uppercase tracking-wide border border-brand/20">
          👴 वरिष्ठ नागरिक मोड (Elder Voice Mode)
        </span>
      </div>

      {/* Main Experience */}
      {!resultScan ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-8">
          <div className="space-y-3 max-w-lg">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              संदेश बोलकर जाँचें
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              नीचे लाल बटन दबाएँ और अपना मैसेज बोलें। AI तुरंत बोलकर जवाब देगा।
            </p>
          </div>

          {/* Giant Microphone Button */}
          <motion.button
            onClick={toggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative size-44 sm:size-52 rounded-full grid place-items-center shadow-2xl transition-colors cursor-pointer ${
              isListening
                ? "bg-danger text-white ring-8 ring-danger/30"
                : "bg-brand text-white hover:bg-brand-hover ring-8 ring-brand/20"
            }`}
          >
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full bg-danger/40"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            <div className="flex flex-col items-center gap-2 relative z-10">
              {isListening ? <Mic className="size-16 sm:size-20 animate-pulse" /> : <Mic className="size-16 sm:size-20" />}
              <span className="text-base sm:text-lg font-bold">
                {isListening ? "सुन रहे हैं... (Listening)" : "दबाएँ और बोलें"}
              </span>
            </div>
          </motion.button>

          {/* Live Spoken Transcript Box */}
          {transcript && (
            <div className="w-full max-w-xl rounded-2xl border-2 border-brand/40 bg-card p-6 shadow-lg text-left space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">आप बोल रहे हैं (Live Speech):</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">
                "{transcript}"
              </p>
              <Button
                className="w-full h-14 rounded-xl text-lg font-bold bg-brand text-white hover:bg-brand-hover shadow-md"
                disabled={busy || !transcript.trim()}
                onClick={analyzeSpokenText}
              >
                {busy ? "जाँच हो रही है (Analyzing...)" : "🔍 अभी जाँच करें (Check Now)"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Fullscreen Color Verdict Screen */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`flex-1 flex flex-col justify-between rounded-[28px] p-6 sm:p-10 shadow-2xl border-4 text-white ${
              resultScan.level === "safe"
                ? "bg-safe border-safe-tint text-white"
                : resultScan.level === "careful"
                ? "bg-careful border-careful-tint text-white"
                : "bg-danger border-danger-tint text-white"
            }`}
          >
            <div className="space-y-6">
              {/* Verdict Header Badge */}
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-base font-bold uppercase tracking-wide">
                  {resultScan.level === "safe" ? (
                    <>
                      <ShieldCheck className="size-6" /> सुरक्षित संदेश (Safe)
                    </>
                  ) : resultScan.level === "careful" ? (
                    <>
                      <AlertTriangle className="size-6" /> सावधान रहें (Be Careful)
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="size-6" /> ख़तरनाक ठगी! (SCAM!)
                    </>
                  )}
                </span>

                <button
                  onClick={() => speak(resultScan.verdict.summary + ". " + resultScan.verdict.whatToDoNow.join(". "), "hi")}
                  className="rounded-full bg-white/20 p-3 hover:bg-white/30 transition-colors"
                  title="फिर से सुनें (Read Aloud)"
                >
                  <Volume2 className="size-7" />
                </button>
              </div>

              {/* Big Verdict Summary */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black leading-tight drop-shadow-md">
                  {resultScan.verdict.summary}
                </h2>
                <p className="text-xl sm:text-2xl opacity-90 font-medium border-l-4 border-white/40 pl-4 py-1">
                  "{resultScan.masked_text}"
                </p>
              </div>

              {/* Action Steps */}
              <div className="rounded-2xl bg-black/20 p-5 space-y-3 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-bold">आगे क्या करें (What to do now):</h3>
                <ul className="space-y-2">
                  {resultScan.verdict.whatToDoNow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-lg font-semibold">
                      <span className="size-2 rounded-full bg-white mt-2.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={resetAll}
                className="h-16 flex-1 rounded-2xl text-xl font-bold bg-white text-black hover:bg-white/90 shadow-xl"
              >
                <RefreshCw className="size-6 mr-2" />
                दूसरी जाँच करें (Check Another)
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/app/scan/${resultScan.id}`)}
                className="h-16 rounded-2xl text-lg font-bold border-white/40 text-white hover:bg-white/20"
              >
                पूरा विवरण (Full Report)
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
