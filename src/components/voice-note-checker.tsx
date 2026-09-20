"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FileAudio, Mic, MicOff, Play, Square, Upload, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { useFamily } from "@/components/family-realtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Scan } from "@/lib/types";

export function VoiceNoteChecker() {
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { lang } = useI18n();
  const { me } = useFamily();
  const router = useRouter();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1);
      }, 1000);
    } catch (e) {
      toast.error(
        lang === "hi"
          ? "माइक्रोफोन की अनुमति नहीं मिली (Microphone access denied)"
          : "Microphone permission denied or not supported."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  async function analyzeAudio() {
    let sourceBlob: Blob | File | null = null;
    let mimeType = "audio/webm";

    if (mode === "upload" && file) {
      sourceBlob = file;
      mimeType = file.type || "audio/mp3";
    } else if (mode === "record" && recordedBlob) {
      sourceBlob = recordedBlob;
      mimeType = recordedBlob.type || "audio/webm";
    }

    if (!sourceBlob || !consent) return;

    setBusy(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || "");
          resolve(raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw);
        };
        reader.onerror = () => reject(new Error("Could not read audio file."));
        reader.readAsDataURL(sourceBlob as Blob);
      });

      const res = await api<{ scan: Scan }>("/api/analyze/audio", {
        method: "POST",
        body: JSON.stringify({
          audioBase64: b64,
          mimeType,
          language: lang,
          country: me?.country || "IN",
          consent: true,
        }),
      });

      toast.success(lang === "hi" ? "वॉइस नोट का विश्लेषण सफल!" : "Voice note analysis complete!");
      router.push(`/app/scan/${res.scan.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Voice note analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-[20px] border border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Volume2 className="size-5 text-brand" />
          {lang === "hi" ? "वॉइस नोट व कॉल रिकॉर्डिंग जाँच" : "Voice Note & Call Recording Checker"}
        </CardTitle>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-brand/10 text-brand">
          WhatsApp & Calls
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Mode Toggle Pills */}
        <div className="flex gap-2 p-1 rounded-xl bg-surface-2 border border-border text-xs font-semibold">
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === "upload" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="size-3.5" />
            {lang === "hi" ? "फाइल अपलोड करें" : "Upload Recording File"}
          </button>
          <button
            onClick={() => setMode("record")}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === "record" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="size-3.5" />
            {lang === "hi" ? "लाइव रिकॉर्ड करें" : "Record Live Voice Note"}
          </button>
        </div>

        {/* Mode 1: File Upload */}
        {mode === "upload" && (
          <div className="space-y-3">
            <Label htmlFor="voice-file" className="text-xs font-semibold text-foreground">
              {lang === "hi"
                ? "व्हाट्सएप वॉइस नोट या कॉल रिकॉर्डिंग (.mp3, .m4a, .wav, .opus, .ogg):"
                : "Select WhatsApp Voice Note or Call Recording (.mp3, .m4a, .wav, .opus, .ogg):"}
            </Label>
            <input
              id="voice-file"
              type="file"
              accept="audio/*,.opus,.m4a,.mp3,.wav,.ogg"
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-brand font-medium flex items-center gap-1.5">
                <FileAudio className="size-4" /> Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
        )}

        {/* Mode 2: Live Recording */}
        {mode === "record" && (
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-2/40 border border-border/60 space-y-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="outline"
                className="size-16 rounded-full border-2 border-brand bg-brand/10 text-brand hover:bg-brand/20 grid place-items-center"
              >
                <Mic className="size-7" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="size-16 rounded-full bg-danger text-white hover:bg-danger/90 grid place-items-center animate-pulse"
              >
                <Square className="size-6 fill-white" />
              </Button>
            )}

            <p className="text-xs font-bold text-foreground">
              {isRecording
                ? `${lang === "hi" ? "रिकॉर्ड हो रहा है:" : "Recording live audio:"} ${recordTime}s`
                : recordedBlob
                ? lang === "hi" ? "ऑडियो रिकॉर्ड हो गया!" : "Recording captured!"
                : lang === "hi" ? "रिकॉर्ड करने के लिए माइक दबाएँ" : "Tap mic to start recording"}
            </p>

            {recordedBlob && (
              <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full h-8 mt-2" />
            )}
          </div>
        )}

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(Boolean(v))}
            className="mt-0.5"
          />
          <span>
            {lang === "hi"
              ? "मैं आवाज़ से टेक्स्ट निकालने के लिए जेमिनी एआई को इस ऑडियो भेजने की सहमति देता/देती हूँ। केवल मास्क्ड टेक्स्ट सुरक्षित रखा जाएगा।"
              : "I consent to send this audio recording to Gemini for speech transcription and scam evaluation."}
          </span>
        </label>

        {/* Submit Button */}
        <Button
          className="w-full h-11 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-hover shadow-md"
          disabled={busy || !consent || (mode === "upload" ? !file : !recordedBlob)}
          onClick={analyzeAudio}
        >
          {busy
            ? lang === "hi" ? "ऑडियो का विश्लेषण हो रहा है..." : "Transcribing & Analyzing Audio..."
            : lang === "hi" ? "🔍 वॉइस नोट जाँचें (Check Voice Note)" : "🔍 Check Voice Note"}
        </Button>
      </CardContent>
    </Card>
  );
}
