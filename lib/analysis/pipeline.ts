// Analysis pipeline (spec 7.1). Orchestrates the engine modules (extract, rules, URL flags,
// scoring, guidance) with the providers and the AI layer, and builds the AnalysisResult.
//
// Honesty rules enforced here:
//  - CheckStatus entries say what actually ran. An unavailable provider is never a clean result.
//  - A provider-confirmed malicious result can never be lowered by the AI layer: aggregate() is
//    expected to enforce it and enforceFloors() below double-checks.
//  - APK results never show the green "likely_safe" state. Phone numbers alone never get a verdict.
//  - Nothing here logs message text, URLs, hashes or provider responses.
//
// All Hindi strings in this file need review by a fluent speaker before release.
import type {
  AggregateOutput,
  AnalysisKind,
  AnalysisResult,
  Bilingual,
  CheckStatus,
  ExtractedEntities,
  FileCheck,
  Indicator,
  PhoneRequest,
  RiskLevel,
  RuleOutput,
  ScamCategory,
  UrlCheck,
  UrlReputationResult,
  ValidatedAi,
  FileKindHint,
  PhoneFlag,
  PhoneReputationResult,
} from "@/lib/types";
import { LIMITS } from "@/lib/types";
import { extractEntities } from "@/lib/urls/extract";
import { localUrlFlags, normalizeUrl } from "@/lib/urls/local";
import { runRules } from "@/lib/analysis/rules";
import { actionsFor, baseLimitations } from "@/lib/analysis/guidance";
import { aggregate } from "@/lib/analysis/scoring";
import { describePhone, phoneGuidance, toE164 } from "@/lib/phone/describe";
import { lookupPhoneReputation } from "@/lib/phone/providers/ipqs";
import { analyzeWithAi } from "@/lib/ai/provider";
import { checkFileHash, checkUrlReputation } from "@/lib/urls/providers";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { InputError } from "@/lib/server/http";

export { InputError };

type Opts = { simulateOutage?: boolean };

const MAX_URLS = 5;
const MAX_ACTIONS = 6;
const MAX_LIMITATIONS = 8;
const SHA256_RE = /^[a-f0-9]{64}$/;

// ------------------------------------------------------------------ bilingual strings

const CATEGORY_LABEL: Record<ScamCategory, Bilingual> = {
  banking_kyc: { en: "fake bank or KYC message", hi: "नकली बैंक या KYC संदेश" },
  upi_payment: { en: "UPI payment trick", hi: "UPI भुगतान की ठगी" },
  government_impersonation: { en: "pretending to be a government office", hi: "सरकारी दफ़्तर होने का दिखावा" },
  delivery_customs: { en: "fake delivery or customs notice", hi: "नकली डिलीवरी या कस्टम सूचना" },
  utility_disconnection: { en: "fake bill or disconnection threat", hi: "नकली बिल या कनेक्शन कटने की धमकी" },
  job_task: { en: "fake job or task offer", hi: "नकली नौकरी या टास्क का ऑफ़र" },
  investment: { en: "investment scam", hi: "निवेश की ठगी" },
  loan_credit: { en: "fake loan or credit offer", hi: "नकली लोन या क्रेडिट ऑफ़र" },
  fake_support: { en: "fake customer support", hi: "नकली कस्टमर सपोर्ट" },
  remote_access_apk: {
    en: "request to install an app or remote-access tool",
    hi: "ऐप या रिमोट-एक्सेस टूल इंस्टॉल करने की माँग",
  },
  family_emergency: { en: "fake family emergency", hi: "परिवार में इमरजेंसी का झूठा दावा" },
  sextortion: { en: "blackmail attempt", hi: "ब्लैकमेल की कोशिश" },
  prize_lottery: { en: "fake prize or lottery", hi: "नकली इनाम या लॉटरी" },
  gambling_spam: { en: "betting or casino promotion", hi: "सट्टेबाज़ी या कैसीनो का प्रचार" },
  credential_theft: {
    en: "attempt to steal your login or card details",
    hi: "आपका लॉगिन या कार्ड विवरण चुराने की कोशिश",
  },
  malicious_file: { en: "dangerous file", hi: "ख़तरनाक फ़ाइल" },
  other: { en: "possible scam", hi: "संभावित ठगी" },
};

const NOTE = {
  phoneUnavailable: {
    en: "We could not check the number's reputation right now.",
    hi: "अभी हम नंबर की रेपुटेशन की जाँच नहीं कर सके।",
  },
  urlUnavailable: {
    en: "We could not check the link's reputation right now.",
    hi: "अभी हम यह जाँच नहीं कर पाए कि यह लिंक पहले से ख़तरनाक बताया गया है या नहीं।",
  },
  urlPartial: {
    en: "Some link-checking services could not be reached. The result used the ones that responded.",
    hi: "कुछ लिंक-जाँच सेवाओं तक पहुँच नहीं हो पाई। नतीजे में उन सेवाओं का उपयोग हुआ जिन्होंने जवाब दिया।",
  },
  urlSimulated: {
    en: "Simulated outage for demonstration. No link-checking service was contacted.",
    hi: "यह सिर्फ़ डेमो के लिए बनाई गई नकली रुकावट है। किसी लिंक-जाँच सेवा से संपर्क नहीं किया गया।",
  },
  urlExtra: {
    en: "Only the first 5 links were checked.",
    hi: "सिर्फ़ पहले 5 लिंक जाँचे गए।",
  },
  aiUnavailable: {
    en: "The AI explanation was not available, so this result uses only our built-in checks.",
    hi: "AI की व्याख्या अभी उपलब्ध नहीं थी, इसलिए यह नतीजा सिर्फ़ हमारी अपनी जाँचों पर आधारित है।",
  },
  fileUnavailable: {
    en: "We could not reach VirusTotal right now (it may be busy). Try again later.",
    hi: "अभी VirusTotal तक नहीं पहुँच पाए (वह व्यस्त हो सकता है)। थोड़ी देर बाद दोबारा कोशिश करें।",
  },
} satisfies Record<string, Bilingual>;

const URL_BASE_ACTION: Bilingual = {
  en: "Do not open links you did not expect. Type the official website address yourself or use the official app.",
  hi: "जिस लिंक की आपको उम्मीद नहीं थी उसे न खोलें। आधिकारिक वेबसाइट का पता खुद टाइप करें या आधिकारिक ऐप इस्तेमाल करें।",
};

const err = {
  invalidUrl: {
    en: "That does not look like a web link. Please check it and try again.",
    hi: "यह वेब लिंक जैसा नहीं दिखता। कृपया जाँचकर दोबारा कोशिश करें।",
  },
  urlTooLong: { en: "That link is too long.", hi: "यह लिंक बहुत लंबा है।" },
  invalidHash: {
    en: "The file fingerprint must be 64 letters and digits (a SHA-256 hash).",
    hi: "फ़ाइल की पहचान (हैश) 64 अक्षरों और अंकों की होनी चाहिए (SHA-256)।",
  },
  invalidPhone: {
    en: "Please enter a phone number.",
    hi: "कृपया फ़ोन नंबर लिखें।",
  },
  descTooLong: {
    en: "That description is too long. Please shorten it.",
    hi: "यह विवरण बहुत लंबा है। कृपया इसे छोटा करें।",
  },
} satisfies Record<string, Bilingual>;

// ------------------------------------------------------------------ small helpers

const PROVIDER_LABEL: Record<string, string> = { virustotal: "VirusTotal", apivoid: "APIVoid" };
const label = (p: string) => PROVIDER_LABEL[p] ?? "A reputation service";

const EMPTY_RULES: RuleOutput = { indicators: [], categories: [], score: 0, signals: {} };

const norm = (b: Bilingual) => b.en.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function mergeBilingual(lists: Bilingual[][], max: number): Bilingual[] {
  const seen = new Set<string>();
  const out: Bilingual[] = [];
  for (const list of lists) {
    for (const b of list) {
      if (!b || !b.en || !b.hi) continue;
      const k = norm(b);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(b);
      if (out.length >= max) return out;
    }
  }
  return out;
}

function isDefinitive(r: UrlReputationResult): boolean {
  return r.status !== "unavailable";
}

function primaryCategory(cats: ScamCategory[]): ScamCategory {
  return cats.find((c) => c !== "other") ?? "other";
}

/**
 * Safety net on top of aggregate(): provider-confirmed results set a floor that nothing
 * (including the AI layer) can lower.
 */
export function enforceFloors(agg: AggregateOutput, urlChecks: UrlCheck[], fileCheck?: FileCheck): AggregateOutput {
  const statuses = [
    ...urlChecks.flatMap((c) => c.reputation.map((r) => r.status as string)),
    ...(fileCheck ? [fileCheck.reputation.status as string] : []),
  ];
  if (statuses.includes("malicious") && agg.riskLevel !== "high") {
    return { ...agg, riskLevel: "high", uiState: "potential_scam", score: Math.max(agg.score, 85) };
  }
  if (statuses.includes("suspicious") && (agg.riskLevel === "no_clear_warning" || agg.riskLevel === "unable")) {
    return { ...agg, riskLevel: "suspicious", uiState: "suspicious", score: Math.max(agg.score, 50) };
  }
  return agg;
}

// ------------------------------------------------------------------ summaries

function messageSummary(level: RiskLevel, cats: ScamCategory[]): Bilingual {
  const cat = CATEGORY_LABEL[primaryCategory(cats)];
  const named = primaryCategory(cats) !== "other";
  switch (level) {
    case "high":
      return named
        ? {
            en: `This looks like a possible scam: ${cat.en}. Do not click links, share codes or PINs, or send money.`,
            hi: `यह संभावित ठगी लगती है: ${cat.hi}। लिंक पर क्लिक न करें, कोड या PIN न बताएँ, और पैसे न भेजें।`,
          }
        : {
            en: "This message has strong warning signs of a scam. Do not click links, share codes or PINs, or send money.",
            hi: "इस संदेश में ठगी के साफ़ संकेत हैं। लिंक पर क्लिक न करें, कोड या PIN न बताएँ, और पैसे न भेजें।",
          };
    case "suspicious":
      return named
        ? {
            en: `This message has warning signs (${cat.en}). Check it through an official app or website before you do anything.`,
            hi: `इस संदेश में चेतावनी के संकेत हैं (${cat.hi})। कुछ भी करने से पहले आधिकारिक ऐप या वेबसाइट से जाँच लें।`,
          }
        : {
            en: "This message has some warning signs. Check it through an official app or website before you do anything.",
            hi: "इस संदेश में कुछ चेतावनी के संकेत हैं। कुछ भी करने से पहले आधिकारिक ऐप या वेबसाइट से जाँच लें।",
          };
    case "no_clear_warning":
      return {
        en: "We did not find clear warning signs in the checks we ran. This does not prove the message is genuine.",
        hi: "हमारी जाँच में साफ़ चेतावनी के संकेत नहीं मिले। इसका मतलब यह नहीं कि संदेश असली है।",
      };
    default:
      return {
        en: "We could not fully check this. Please verify it through an official app, website or a number you find yourself.",
        hi: "हम इसे पूरी तरह जाँच नहीं पाए। कृपया आधिकारिक ऐप, वेबसाइट या अपने आप ढूँढे गए नंबर से इसकी पुष्टि करें।",
      };
  }
}

function urlSummary(level: RiskLevel): Bilingual {
  switch (level) {
    case "high":
      return { en: "This link looks dangerous. Do not open it.", hi: "यह लिंक ख़तरनाक लगता है। इसे न खोलें।" };
    case "suspicious":
      return {
        en: "This link has warning signs. Do not open it unless you can confirm who sent it.",
        hi: "इस लिंक में चेतावनी के संकेत हैं। जब तक भेजने वाले की पुष्टि न हो, इसे न खोलें।",
      };
    case "no_clear_warning":
      return {
        en: "We did not find clear warning signs for this link. A new scam link may not be on any list yet, so this does not prove it is safe.",
        hi: "इस लिंक में हमें साफ़ चेतावनी के संकेत नहीं मिले। नया ठगी वाला लिंक अभी किसी सूची में न हो सकता है, इसलिए इसका मतलब यह नहीं कि लिंक सुरक्षित है।",
      };
    default:
      return {
        en: "We could not fully check this link. Do not open it unless you trust who sent it.",
        hi: "हम इस लिंक को पूरी तरह जाँच नहीं पाए। भेजने वाले पर भरोसा न हो तो इसे न खोलें।",
      };
  }
}

// ------------------------------------------------------------------ URL checking

async function safeReputation(url: string, opts: Opts): Promise<UrlReputationResult[]> {
  try {
    const r = await checkUrlReputation(url, { simulateOutage: opts.simulateOutage });
    if (Array.isArray(r) && r.length > 0) return r;
  } catch {
    // fall through
  }
  return [
    { provider: "virustotal", status: "unavailable", threatTypes: [], checkedAt: new Date().toISOString(), detail: "error" },
  ];
}

type CheckedUrl = { raw: string; check: UrlCheck };

async function checkOneUrl(raw: string, opts: Opts): Promise<CheckedUrl | null> {
  const local = localUrlFlags(raw);
  if (!local) return null;
  const reputation = await safeReputation(local.url, opts);
  return { raw, check: { url: local.url, hostname: local.hostname, flags: local.flags, reputation } };
}

function urlReputationCheck(checked: UrlCheck[], unchecked: number, simulated: boolean, overCap = false): CheckStatus {
  if (checked.length === 0 && unchecked === 0) return { id: "url_reputation", status: "not_applicable" };
  const def = (c: UrlCheck) => c.reputation.some(isDefinitive);
  const allDef = checked.length > 0 && unchecked === 0 && checked.every(def);
  const someUnavailable = checked.some((c) => c.reputation.some((r) => !isDefinitive(r)));
  if (simulated) return { id: "url_reputation", status: "unavailable", note: NOTE.urlSimulated };
  if (allDef) {
    // "ran": every URL got at least one definitive provider answer. Partial provider outages get a note.
    return someUnavailable
      ? { id: "url_reputation", status: "ran", note: NOTE.urlPartial }
      : { id: "url_reputation", status: "ran" };
  }
  // Some links could not be checked at all (all providers down, or beyond the 5-link cap):
  // report "unavailable" so the result can never read as fully checked.
  const note = overCap ? NOTE.urlExtra : NOTE.urlUnavailable;
  return { id: "url_reputation", status: "unavailable", note };
}

function providerIndicators(checked: CheckedUrl[], text: string): Indicator[] {
  const out: Indicator[] = [];
  checked.forEach(({ raw, check }, i) => {
    for (const r of check.reputation) {
      if (r.status !== "malicious" && r.status !== "suspicious") continue;
      const mal = r.status === "malicious";
      const ind: Indicator = {
        id: `url_reputation_${r.provider}_${i}`,
        type: "url_reputation",
        source: "url_provider",
        explanation: {
          en: `${label(r.provider)} reported this link as ${mal ? "malicious" : "suspicious"}${r.detail ? ` (${r.detail})` : ""}.`,
          hi: `${label(r.provider)} ने इस लिंक को ${mal ? "ख़तरनाक" : "संदिग्ध"} बताया है।`,
        },
        points: mal ? 50 : 20,
      };
      if (text.includes(raw)) ind.evidence = raw;
      out.push(ind);
    }
  });
  return out;
}

function flagIndicators(checked: CheckedUrl[], text: string): Indicator[] {
  const out: Indicator[] = [];
  checked.forEach(({ raw, check }, i) => {
    for (const f of check.flags) {
      const ind: Indicator = {
        id: `link_${f.id}_${i}`,
        type: "link_risk",
        source: "rule",
        explanation: f.explanation,
        points: f.points,
      };
      if (text.includes(raw)) ind.evidence = raw;
      out.push(ind);
    }
  });
  return out;
}

// ------------------------------------------------------------------ AI merge

function mergeIndicators(rule: Indicator[], flags: Indicator[], provider: Indicator[], ai: Indicator[]): Indicator[] {
  const key = (i: Indicator) => `${i.type}|${(i.evidence ?? "").toLowerCase()}`;
  const seen = new Set(rule.filter((i) => i.evidence).map(key));
  const aiKept = ai.filter((i) => !(i.evidence && seen.has(key(i))));
  return [...provider, ...rule, ...flags, ...aiKept];
}

async function safeAi(args: { text: string; entities: ExtractedEntities; rules: RuleOutput }) {
  try {
    return await analyzeWithAi(args);
  } catch {
    return { status: "unavailable" as const, ai: null };
  }
}

// ------------------------------------------------------------------ shared text analysis

type TextAnalysis = {
  agg: AggregateOutput;
  summary: Bilingual;
  requestedAction?: Bilingual;
  indicators: Indicator[];
  urlChecks: UrlCheck[];
  recommendedActions: Bilingual[];
  limitations: Bilingual[];
  checks: CheckStatus[];
  aiUsed: boolean;
};

async function analyzeText(text: string, kind: AnalysisKind, opts: Opts): Promise<TextAnalysis> {
  const entities = extractEntities(text);
  const rules = runRules(text);
  const toCheck = entities.urls.slice(0, MAX_URLS);

  const [checkedRaw, aiOut] = await Promise.all([
    Promise.all(toCheck.map((u) => checkOneUrl(u, opts))),
    safeAi({ text, entities, rules }),
  ]);
  const checkedUrls = checkedRaw.filter((c): c is CheckedUrl => c !== null);
  const urlChecks = checkedUrls.map((c) => c.check);
  const unchecked = entities.urls.length - checkedUrls.length;
  const ai: ValidatedAi | null = aiOut.status === "ran" ? aiOut.ai : null;

  const checks: CheckStatus[] = [
    { id: "rules", status: "ran" },
    {
      id: "ai",
      status: aiOut.status,
      ...(aiOut.status === "unavailable" ? { note: NOTE.aiUnavailable } : {}),
    },
    urlReputationCheck(urlChecks, unchecked, !!opts.simulateOutage, entities.urls.length > MAX_URLS),
  ];

  const agg = enforceFloors(aggregate({ kind, rules, urlChecks, ai, checks }), urlChecks);

  const indicators = mergeIndicators(
    rules.indicators,
    flagIndicators(checkedUrls, text),
    providerIndicators(checkedUrls, text),
    ai?.indicators ?? [],
  );

  const aiSummaryOk =
    !!ai && !!ai.summary.en && !!ai.summary.hi && !((agg.riskLevel === "high" || agg.riskLevel === "suspicious") && ai.riskLevel === "low");
  const summary = aiSummaryOk && ai ? ai.summary : messageSummary(agg.riskLevel, agg.categories);

  const urlStatus = checks.find((c) => c.id === "url_reputation");
  const limitationNotes: Bilingual[] = [];
  if (urlStatus?.status === "unavailable") limitationNotes.push(NOTE.urlUnavailable);
  if (entities.urls.length > MAX_URLS) limitationNotes.push(NOTE.urlExtra);
  if (aiOut.status === "unavailable") limitationNotes.push(NOTE.aiUnavailable);

  return {
    agg,
    summary,
    requestedAction: ai?.requestedAction,
    indicators,
    urlChecks,
    recommendedActions: mergeBilingual([actionsFor(agg.categories, agg.riskLevel), ai?.recommendedActions ?? []], MAX_ACTIONS),
    limitations: mergeBilingual([baseLimitations(), ai?.limitations ?? [], limitationNotes], MAX_LIMITATIONS),
    checks,
    aiUsed: !!ai,
  };
}

function toResult(kind: AnalysisKind, t: TextAnalysis, extra: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: crypto.randomUUID(),
    kind,
    createdAt: new Date().toISOString(),
    riskLevel: t.agg.riskLevel,
    uiState: t.agg.uiState,
    score: t.agg.score,
    // A "likely safe" result must not carry scam categories or AI warning notes: they would show
    // up as "why it looks suspicious" on a message the checks found nothing wrong with.
    categories: t.agg.uiState === "likely_safe" ? [] : t.agg.categories,
    summary: t.summary,
    ...(t.requestedAction ? { requestedAction: t.requestedAction } : {}),
    indicators: t.agg.uiState === "likely_safe" ? t.indicators.filter((i) => i.source !== "ai") : t.indicators,
    urlChecks: t.urlChecks,
    recommendedActions: t.recommendedActions,
    limitations: t.limitations,
    evidenceConfidence: t.agg.evidenceConfidence,
    checks: t.checks,
    aiUsed: t.aiUsed,
    ...extra,
  };
}

// ------------------------------------------------------------------ public API

export async function analyzeMessage(text: string, opts: Opts = {}): Promise<AnalysisResult> {
  const elapsed = startTimer();
  const t = await analyzeText(text, "message", opts);
  const result = toResult("message", t);
  logEvent("pipeline.message", { durationMs: elapsed(), status: result.riskLevel, count: result.urlChecks.length });
  return result;
}

export async function analyzeUrl(rawUrl: string, opts: Opts = {}): Promise<AnalysisResult> {
  const elapsed = startTimer();
  const trimmed = (rawUrl ?? "").trim();
  if (trimmed.length > LIMITS.urlMaxChars) throw new InputError("too_long", err.urlTooLong);
  const normalized = trimmed ? normalizeUrl(trimmed) : null;
  const local = normalized ? localUrlFlags(normalized) : null;
  if (!normalized || !local) throw new InputError("invalid_input", err.invalidUrl);

  const rules = runRules(trimmed);
  const reputation = await safeReputation(local.url, opts);
  const urlCheck: UrlCheck = { url: local.url, hostname: local.hostname, flags: local.flags, reputation };
  const checked: CheckedUrl[] = [{ raw: trimmed, check: urlCheck }];

  const checks: CheckStatus[] = [
    { id: "rules", status: "ran" },
    { id: "ai", status: "not_applicable" },
    urlReputationCheck([urlCheck], 0, !!opts.simulateOutage),
  ];
  const agg = enforceFloors(aggregate({ kind: "url", rules, urlChecks: [urlCheck], ai: null, checks }), [urlCheck]);

  const limitations = mergeBilingual(
    [
      baseLimitations(),
      checks[2].status === "unavailable" ? [NOTE.urlUnavailable] : [],
    ],
    MAX_LIMITATIONS,
  );
  const result = toResult("url", {
    agg,
    summary: urlSummary(agg.riskLevel),
    indicators: mergeIndicators(rules.indicators, flagIndicators(checked, trimmed), providerIndicators(checked, trimmed), []),
    urlChecks: [urlCheck],
    recommendedActions: mergeBilingual([actionsFor(agg.categories, agg.riskLevel), [URL_BASE_ACTION]], MAX_ACTIONS),
    limitations,
    checks,
    aiUsed: false,
  });
  logEvent("pipeline.url", { durationMs: elapsed(), status: result.riskLevel });
  return result;
}

const PHONE_LIMITATION: Bilingual = {
  en: "A phone number on its own cannot tell us whether a caller or sender is genuine. We do not rate numbers.",
  hi: "सिर्फ़ फ़ोन नंबर से यह पता नहीं चल सकता कि कॉल करने या संदेश भेजने वाला असली है या नहीं। हम नंबरों को रेट नहीं करते।",
};

const PHONE_FLAG_TEXT: Record<PhoneFlag, Bilingual> = {
  risky: {
    en: "risky (for example linked to fraud, scams or robocalls)",
    hi: "जोखिम भरा (जैसे ठगी, स्कैम या रोबोकॉल से जुड़ा)",
  },
  recent_abuse: { en: "linked to recent fraud or abuse", hi: "हाल की ठगी या दुरुपयोग से जुड़ा" },
  spammer: {
    en: "reported for spam or harassing calls or texts",
    hi: "स्पैम या परेशान करने वाले कॉल या संदेशों के लिए रिपोर्ट किया गया",
  },
  high_fraud_score: { en: "given a high fraud rating by the service", hi: "सेवा ने इसे ऊंची ठगी रेटिंग दी है" },
};

/** How many provider flags are needed before a number moves a result to "suspicious". */
const MIN_PHONE_FLAGS_FOR_VERDICT = 2;

const PHONE_REPUTATION_LIMIT: Bilingual = {
  en: "The number check comes from another company's records. A number with no flag is not necessarily genuine, because scammers use new numbers and can fake the number shown on your phone.",
  hi: "नंबर की यह जाँच किसी दूसरी कंपनी के रिकॉर्ड से आती है। जिस नंबर पर कोई चेतावनी नहीं है, वह ज़रूरी नहीं कि असली हो, क्योंकि ठग नए नंबर इस्तेमाल करते हैं और आपके फ़ोन पर दिखने वाला नंबर नकली भी दिखा सकते हैं।",
};

/**
 * Fold an optional number-reputation lookup into a phone result. The provider's flags are shown
 * as the provider's flags (never as ASTRA's own verdict on a person), and at most they move the
 * result to "suspicious". A number with no flag is still never "likely safe".
 */
function applyPhoneReputation(result: AnalysisResult, rep: PhoneReputationResult | null): AnalysisResult {
  if (!rep) return result; // not set up: leave the check out
  const ok = rep.status === "ok";
  const checks: CheckStatus[] = [
    ...result.checks,
    { id: "phone_reputation", status: ok ? "ran" : "unavailable", ...(ok ? {} : { note: NOTE.phoneUnavailable }) },
  ];
  const out: AnalysisResult = {
    ...result,
    phoneReputation: rep,
    checks,
    limitations: mergeBilingual([result.limitations, [ok ? PHONE_REPUTATION_LIMIT : NOTE.phoneUnavailable]], MAX_LIMITATIONS),
  };
  if (!ok || rep.flags.length === 0) return out;
  // One flag on its own is shown, but it does not change the verdict: a service's single warning
  // (for example a borderline "risky") is too weak to call a number suspicious. Two or more do.
  const strongEnough = rep.flags.length >= MIN_PHONE_FLAGS_FOR_VERDICT;

  const reasonsEn = rep.flags.map((f) => PHONE_FLAG_TEXT[f].en).join("; ");
  const reasonsHi = rep.flags.map((f) => PHONE_FLAG_TEXT[f].hi).join("; ");
  const indicator: Indicator = {
    id: "phone_reputation_flag",
    type: "other",
    source: "phone_provider",
    explanation: {
      en: `IPQualityScore, a number-reputation service, lists this number as: ${reasonsEn}. This is another company's record and can be wrong or out of date.`,
      hi: `नंबर की रेपुटेशन जाँचने वाली सेवा IPQualityScore इस नंबर को इस तरह बताती है: ${reasonsHi}। यह किसी दूसरी कंपनी का रिकॉर्ड है और गलत या पुराना हो सकता है।`,
    },
    points: 20,
  };
  out.indicators = [...result.indicators, indicator];
  if (!strongEnough) return out; // a single flag is shown with its source, but changes nothing else

  out.recommendedActions = mergeBilingual(
    [
      [
        {
          en: "Do not answer, call back or reply to this number, and do not share anything with it.",
          hi: "इस नंबर को जवाब न दें, वापस फ़ोन न करें और इससे कुछ भी साझा न करें।",
        },
      ],
      result.recommendedActions,
    ],
    8,
  );
  if (out.riskLevel === "unable" || out.riskLevel === "no_clear_warning") {
    out.riskLevel = "suspicious";
    out.uiState = "suspicious";
    out.score = Math.max(out.score, 25);
    out.summary = {
      en: "A number-reputation service has flagged this number. Be careful and do not act on what it asks.",
      hi: "नंबर की रेपुटेशन जाँचने वाली एक सेवा ने इस नंबर को चेतावनी के साथ दिखाया है। सावधान रहें और जो यह कहे उस पर कुछ न करें।",
    };
  }
  if (out.evidenceConfidence === "low") out.evidenceConfidence = "medium";
  return out;
}

export async function analyzePhone(
  number: string,
  context?: PhoneRequest["context"],
  opts: { simulateOutage?: boolean } = {},
): Promise<AnalysisResult> {
  const elapsed = startTimer();
  const trimmed = (number ?? "").trim();
  if (!trimmed) throw new InputError("invalid_input", err.invalidPhone);
  if (trimmed.length > 40) throw new InputError("too_long", { en: "That number is too long.", hi: "यह नंबर बहुत लंबा है।" });
  const description = context?.description?.trim() ?? "";
  if (description.length > LIMITS.phoneDescriptionMaxChars) throw new InputError("too_long", err.descTooLong);

  const phone = describePhone(trimmed);
  const guidance = phoneGuidance(context?.channel, phone);
  // Optional number-reputation lookup, started now so it runs while the rest of the check runs.
  const e164 = toE164(trimmed);
  const repPromise: Promise<PhoneReputationResult | null> = e164
    ? lookupPhoneReputation(e164, { simulateOutage: opts.simulateOutage })
    : Promise.resolve(null);

  if (!description) {
    // Never a verdict on the number itself.
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      kind: "phone",
      createdAt: new Date().toISOString(),
      riskLevel: "unable",
      uiState: "unable",
      score: 0,
      categories: [],
      summary: {
        en: "We can describe the number's format, but we cannot tell from a number alone whether it is a scam.",
        hi: "हम नंबर का फ़ॉर्मेट बता सकते हैं, लेकिन सिर्फ़ नंबर देखकर यह नहीं बता सकते कि यह ठगी है या नहीं।",
      },
      indicators: [],
      urlChecks: [],
      phone,
      recommendedActions: mergeBilingual([guidance], 8),
      limitations: [PHONE_LIMITATION],
      evidenceConfidence: "low",
      checks: [
        { id: "rules", status: "not_applicable" },
        { id: "ai", status: "not_applicable" },
        { id: "url_reputation", status: "not_applicable" },
      ],
      aiUsed: false,
    };
    const final = applyPhoneReputation(result, await repPromise);
    logEvent("pipeline.phone", { durationMs: elapsed(), status: final.riskLevel });
    return final;
  }

  // The described context goes through the same analysis as a message (rules, optional AI,
  // link checks). A red or amber result appears only when that context shows scam behavior.
  const t = await analyzeText(description, "phone", {});
  const flagged = t.agg.riskLevel === "high" || t.agg.riskLevel === "suspicious";
  const agg: AggregateOutput = flagged
    ? t.agg
    : { ...t.agg, riskLevel: "unable", uiState: "unable" }; // never "likely safe" for a phone contact
  const summary = flagged
    ? t.summary
    : {
        en: "We did not find clear warning signs in what you described, but we cannot judge the number itself. Stay careful.",
        hi: "आपके बताए हालात में हमें साफ़ चेतावनी के संकेत नहीं मिले, लेकिन हम नंबर को खुद जाँच नहीं सकते। सावधान रहें।",
      };
  const result = toResult(
    "phone",
    {
      ...t,
      agg,
      summary,
      recommendedActions: mergeBilingual([guidance, t.recommendedActions], 8),
      limitations: mergeBilingual([[PHONE_LIMITATION], t.limitations], MAX_LIMITATIONS),
    },
    { phone },
  );
  const final = applyPhoneReputation(result, await repPromise);
  logEvent("pipeline.phone", { durationMs: elapsed(), status: final.riskLevel });
  return final;
}

// ------------------------------------------------------------------ files (apps, programs, archives, documents)

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const FILE_TYPE_ACTIONS: Record<FileKindHint, Bilingual[]> = {
  app: [
    {
      en: "Install apps only from the official Google Play Store, even if a friend or an official-looking message sends you a file.",
      hi: "ऐप सिर्फ़ आधिकारिक Google Play Store से ही इंस्टॉल करें, चाहे फ़ाइल किसी दोस्त या सरकारी/बैंक जैसे दिखने वाले संदेश से आई हो।",
    },
  ],
  program: [
    {
      en: "Install computer software only from the maker's own official website. Programs sent by message or email are a common way to spread viruses.",
      hi: "कंप्यूटर सॉफ़्टवेयर सिर्फ़ बनाने वाली कंपनी की अपनी आधिकारिक वेबसाइट से ही इंस्टॉल करें। संदेश या ईमेल में भेजे गए प्रोग्राम वायरस फैलाने का आम तरीका हैं।",
    },
  ],
  archive: [
    {
      en: "A zip or other packed folder can hide a program inside it. Do not open anything from it. If you really need what is inside, ask the sender through another way, such as a phone call to a number you already know.",
      hi: "ज़िप या ऐसे पैक किए फ़ोल्डर के अंदर कोई प्रोग्राम छिपा हो सकता है। उसमें से कुछ भी न खोलें। अगर आपको अंदर की चीज़ सच में चाहिए, तो भेजने वाले से किसी और तरीके से पूछें, जैसे आपके जाने-पहचाने नंबर पर फ़ोन करके।",
    },
  ],
  document: [
    {
      en: "Do not click 'Enable editing' or 'Enable content' in a document you did not expect. Scammers use that to run hidden programs.",
      hi: "जिस दस्तावेज़ की आपको उम्मीद नहीं थी, उसमें 'Enable editing' या 'Enable content' पर क्लिक न करें। ठग इसी से छिपे प्रोग्राम चलवाते हैं।",
    },
  ],
  other: [],
};

export async function analyzeFile(
  sha256: string,
  opts: Opts & { fileType?: FileKindHint } = {},
): Promise<AnalysisResult> {
  const elapsed = startTimer();
  const hash = typeof sha256 === "string" ? sha256.trim().toLowerCase() : "";
  if (!SHA256_RE.test(hash)) throw new InputError("invalid_input", err.invalidHash);

  const reputation = await checkFileHash(hash, { simulateOutage: opts.simulateOutage });
  const fileCheck: FileCheck = { sha256: hash, reputation };
  const st = reputation.status;
  const unavailable = st === "unavailable";

  const checks: CheckStatus[] = [
    { id: "rules", status: "not_applicable" },
    { id: "ai", status: "not_applicable" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: unavailable ? "unavailable" : "ran", ...(unavailable ? { note: NOTE.fileUnavailable } : {}) },
  ];

  const indicators: Indicator[] = [];
  if (st === "malicious" || st === "suspicious") {
    const c = reputation.engineCounts ?? { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
    const names = (reputation.topThreatNames ?? []).slice(0, 3);
    const nameEn = names.length ? ` (for example: ${names.join(", ")})` : "";
    indicators.push({
      id: "file_reputation_virustotal",
      type: "file_reputation",
      source: "file_provider",
      explanation:
        st === "malicious"
          ? {
              en: `${c.malicious} security ${plural(c.malicious, "engine", "engines")} on VirusTotal flagged this file as malicious${nameEn}.`,
              hi: `VirusTotal पर ${c.malicious} सुरक्षा इंजनों ने इस फ़ाइल को ख़तरनाक बताया है।`,
            }
          : {
              en: `${c.malicious} ${plural(c.malicious, "engine", "engines")} flagged this file as malicious and ${c.suspicious} as suspicious on VirusTotal${nameEn}.`,
              hi: `VirusTotal पर ${c.malicious} इंजनों ने इस फ़ाइल को ख़तरनाक और ${c.suspicious} ने संदिग्ध बताया है।`,
            },
      points: st === "malicious" ? 50 : 20,
    });
  }

  let agg = enforceFloors(
    aggregate({ kind: "file", rules: EMPTY_RULES, urlChecks: [], fileCheck, ai: null, checks }),
    [],
    fileCheck,
  );
  // A file that arrived through chat is never "Likely safe", whatever the report says.
  if (agg.uiState === "likely_safe") agg = { ...agg, uiState: "unable" };
  const flagged = st === "malicious" || st === "suspicious";
  const categories: ScamCategory[] = flagged && !agg.categories.includes("malicious_file")
    ? [...agg.categories, "malicious_file"]
    : agg.categories;

  const summaries: Record<typeof st, Bilingual> = {
    malicious: {
      en: "Do not open or run this file. Several security engines on VirusTotal flagged it as malicious.",
      hi: "इस फ़ाइल को न खोलें और न चलाएं। VirusTotal पर कई सुरक्षा इंजनों ने इसे ख़तरनाक बताया है।",
    },
    suspicious: {
      en: "Be careful with this file. A few security engines flagged it. Do not open or run it.",
      hi: "इस फ़ाइल से सावधान रहें। कुछ सुरक्षा इंजनों ने इसे संदिग्ध बताया है। इसे न खोलें और न चलाएं।",
    },
    no_detections: {
      en: "No security engine on VirusTotal flagged this file. That does not make a file that came through a chat or email safe to open.",
      hi: "VirusTotal पर किसी सुरक्षा इंजन ने इस फ़ाइल को संदिग्ध नहीं बताया। फिर भी चैट या ईमेल में आई फ़ाइल को खोलना सुरक्षित नहीं माना जा सकता।",
    },
    not_found: {
      en: "We could not find this file in VirusTotal's records. That is not a sign that it is safe.",
      hi: "हमें VirusTotal के रिकॉर्ड में यह फ़ाइल नहीं मिली। इसका मतलब यह नहीं कि यह सुरक्षित है।",
    },
    unavailable: {
      en: "We cannot check this file right now. Please do not open or run it.",
      hi: "अभी हम इस फ़ाइल की जाँच नहीं कर पा रहे हैं। कृपया इसे न खोलें और न चलाएं।",
    },
  };

  const fileActions: Bilingual[] = [
    {
      en: "Do not open or run this file. Delete it.",
      hi: "इस फ़ाइल को न खोलें और न चलाएं। इसे डिलीट कर दें।",
    },
    ...(FILE_TYPE_ACTIONS[opts.fileType ?? "other"] ?? []),
    {
      en: "If you already opened it, or it asked for permissions or to enable editing, contact your bank right away, change your passwords from another device, and use the 'Lost money?' panel on this page.",
      hi: "अगर आप इसे पहले ही खोल चुके हैं, या इसने अनुमतियाँ या एडिटिंग चालू करने को कहा था, तो तुरंत अपने बैंक से संपर्क करें, किसी दूसरे डिवाइस से अपने पासवर्ड बदलें और इस पेज का 'पैसे का नुकसान हुआ?' (Lost money?) हिस्सा देखें।",
    },
  ];

  const limitations: Bilingual[] = [
    {
      en: "Not found means VirusTotal has no record of this exact file; it does not mean the file is safe.",
      hi: "'नहीं मिला' का मतलब सिर्फ़ यह है कि VirusTotal के पास इस सटीक फ़ाइल का रिकॉर्ड नहीं है; इसका मतलब यह नहीं कि फ़ाइल सुरक्षित है।",
    },
    {
      en: "This check only looks at the file's fingerprint. It cannot tell what the file would do, and a changed copy of the same file has a different fingerprint.",
      hi: "यह जाँच सिर्फ़ फ़ाइल की पहचान (हैश) देखती है। यह नहीं बता सकती कि फ़ाइल क्या करेगी, और उसी फ़ाइल की बदली हुई कॉपी की पहचान अलग होती है।",
    },
    ...(unavailable ? [NOTE.fileUnavailable] : []),
  ];

  const result: AnalysisResult = {
    id: crypto.randomUUID(),
    kind: "file",
    createdAt: new Date().toISOString(),
    riskLevel: agg.riskLevel,
    uiState: agg.uiState,
    score: agg.score,
    categories,
    summary: summaries[st],
    indicators,
    urlChecks: [],
    fileCheck,
    recommendedActions: mergeBilingual([fileActions, actionsFor(categories, agg.riskLevel)], MAX_ACTIONS),
    limitations: mergeBilingual([limitations], MAX_LIMITATIONS),
    evidenceConfidence: agg.evidenceConfidence,
    checks,
    aiUsed: false,
  };
  logEvent("pipeline.file", { durationMs: elapsed(), status: result.riskLevel });
  return result;
}
