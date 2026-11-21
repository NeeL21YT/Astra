"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AnalysisResult } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import { cancelSpeech, getSpeechSupport, speak, subscribeToVoices } from "@/lib/client/speech";
import type { SpeechSupport } from "@/lib/client/speech";
import { buildReadAloudScript } from "@/lib/client/share";
import { SpeakerIcon, StopIcon } from "@/components/ui/icons";

export function ReadAloudButton({ result }: { result: AnalysisResult }) {
  const { lang, t } = useLang();
  const support = useSyncExternalStore(
    subscribeToVoices,
    () => getSpeechSupport(lang),
    () => "loading" as SpeechSupport,
  );
  const script = useMemo(() => buildReadAloudScript(result, lang), [result, lang]);
  // The script that is currently being read. Changing language or result changes
  // the script, which makes `speaking` false and (via the cleanup below) stops audio.
  const [speakingScript, setSpeakingScript] = useState<string | null>(null);
  const speaking = speakingScript === script;

  useEffect(() => () => cancelSpeech(), [script]);

  if (support === "loading") return null;
  if (support !== "ready") {
    return <p className="text-small text-muted">{t("read.unavailable")}</p>;
  }

  function toggle() {
    if (speaking) {
      cancelSpeech();
      setSpeakingScript(null);
      return;
    }
    const started = speak(script, lang, () => setSpeakingScript((cur) => (cur === script ? null : cur)));
    if (started) setSpeakingScript(script);
  }

  return (
    <div>
      <button type="button" onClick={toggle} className="btn btn-secondary w-full sm:w-auto">
        {speaking ? <StopIcon size={22} /> : <SpeakerIcon size={22} />}
        {speaking ? t("read.stop") : t("read.button")}
      </button>
      <p role="status" className="sr-only">
        {speaking ? t("read.speaking") : ""}
      </p>
    </div>
  );
}
