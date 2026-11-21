/**
 * Shared contracts for ASTRA. Every module (engine, providers, API routes, UI)
 * imports its types from here. Do not change a type without telling the others.
 *
 * Product rules these types encode (see PS01-ScamShield-idea.md):
 *  - Never claim a message/link/file is "safe". "likely_safe" is only allowed
 *    when every applicable check actually ran and found nothing.
 *  - Rule content is bilingual (English + Hindi) so the UI language toggle is instant.
 *  - Raw user input is never stored or logged.
 */

export type Lang = "en" | "hi";
export type Bilingual = { en: string; hi: string };

/** Internal risk label. */
export type RiskLevel = "high" | "suspicious" | "no_clear_warning" | "unable";
/** What the interface shows: Potential Scam (red) / Suspicious (amber) / Likely Safe (green) / neutral. */
export type UiState = "potential_scam" | "suspicious" | "likely_safe" | "unable";

export type ScamCategory =
  | "banking_kyc"
  | "upi_payment"
  | "government_impersonation"
  | "delivery_customs"
  | "utility_disconnection"
  | "job_task"
  | "investment"
  | "loan_credit"
  | "fake_support"
  | "remote_access_apk"
  | "family_emergency"
  | "sextortion"
  | "prize_lottery"
  | "gambling_spam"
  | "credential_theft"
  | "malicious_file"
  | "other";

export type IndicatorType =
  | "credential_request"
  | "payment_request"
  | "urgency"
  | "threat"
  | "prize_bait"
  | "install_request"
  | "impersonation"
  | "secrecy"
  | "isolation"
  | "advance_fee"
  | "link_risk"
  | "url_reputation"
  | "file_reputation"
  | "other";

export type Indicator = {
  /** Stable id, e.g. a rule id such as "credential_request". */
  id: string;
  type: IndicatorType;
  source: "rule" | "ai" | "url_provider" | "file_provider" | "phone_provider";
  /** Exact substring of the submitted text, when one exists. */
  evidence?: string;
  /** True when the indicator is an inference with no exact span in the text. */
  inferred?: boolean;
  explanation: Bilingual;
  /** Points this indicator contributed to the internal product score. */
  points: number;
};

// ---------------------------------------------------------------- entities

export type ExtractedEntities = {
  urls: string[];
  phones: string[];
  upiIds: string[];
  emails: string[];
};

// ------------------------------------------------------------------- URLs

export type UrlFlagId =
  | "shortener"
  | "punycode"
  | "ip_host"
  | "http_only"
  | "brand_lookalike"
  | "misleading_subdomain"
  | "suspicious_tld"
  | "userinfo_in_url";

/** A locally detected property of a URL (no network involved). */
export type UrlFlag = {
  id: UrlFlagId;
  explanation: Bilingual;
  points: number;
};

export type ProviderStatus = "malicious" | "suspicious" | "no_match" | "unknown" | "unavailable";

export type UrlReputationResult = {
  provider: string;
  status: ProviderStatus;
  threatTypes: string[];
  checkedAt: string; // ISO
  referenceUrl?: string;
  /** Short human note, e.g. "3 of 90 engines flagged this URL". */
  detail?: string;
};

export type UrlCheck = {
  /** Normalized URL as analyzed. */
  url: string;
  hostname: string;
  flags: UrlFlag[];
  reputation: UrlReputationResult[];
};

// ------------------------------------------------------------------ files

export type FileReputationResult = {
  provider: string;
  status: "malicious" | "suspicious" | "no_detections" | "not_found" | "unavailable";
  engineCounts?: { malicious: number; suspicious: number; harmless: number; undetected: number };
  topThreatNames?: string[];
  firstSeen?: string;
  lastAnalyzed?: string;
  checkedAt: string;
  referenceUrl?: string;
};

export type FileCheck = {
  sha256: string;
  reputation: FileReputationResult;
};

// ------------------------------------------------------------------ phone

export type PhoneKind = "indian_mobile" | "indian_landline" | "international" | "short_code" | "invalid";

/** Line type from the numbering plan (offline data). It says nothing about who uses the number. */
export type PhoneLineType =
  | "mobile"
  | "landline"
  | "mobile_or_landline"
  | "voip"
  | "toll_free"
  | "premium"
  | "shared_cost"
  | "other";

export type PhoneDescription = {
  kind: PhoneKind;
  /** Masked form safe to display and share, e.g. "+91 ••••• ••123". */
  masked: string;
  description: Bilingual;
  /** ISO 3166 country code from the number's country code, when it could be read. */
  country?: string;
  countryName?: Bilingual;
  lineType?: PhoneLineType;
  /** False when the digits match no known number range for that country (typo, or a faked number). */
  numberPlanMatch?: boolean;
};

/** Why a number-reputation service flagged a number. These are the provider's flags, not ASTRA's verdict. */
export type PhoneFlag = "risky" | "recent_abuse" | "spammer" | "high_fraud_score";

export type PhoneReputationResult = {
  provider: string;
  status: "ok" | "unavailable";
  /** The provider's own view of whether the number is assigned by carriers. */
  valid?: boolean;
  lineType?: PhoneLineType;
  carrier?: string;
  voip?: boolean;
  prepaid?: boolean;
  flags: PhoneFlag[];
  checkedAt: string; // ISO
};

export type PhoneChannel = "call" | "sms" | "whatsapp" | "other";

// ----------------------------------------------------------------- engine

export type RuleOutput = {
  indicators: Indicator[];
  categories: ScamCategory[];
  /** Internal product score 0-100 (never shown as a probability). */
  score: number;
  /** Raw boolean signals, useful for tests and scoring (e.g. credential_request: true). */
  signals: Record<string, boolean>;
};

export type CheckId = "rules" | "ai" | "url_reputation" | "file_reputation" | "phone_reputation";
export type CheckStatus = {
  id: CheckId;
  status: "ran" | "unavailable" | "skipped" | "not_applicable";
  note?: Bilingual;
};

export type AnalysisKind = "message" | "url" | "phone" | "file";

/** What the AI layer returns after server-side validation (see lib/analysis/schema.ts). */
export type ValidatedAi = {
  categories: ScamCategory[];
  riskLevel: "high" | "suspicious" | "low";
  evidenceConfidence: "low" | "medium" | "high";
  summary: Bilingual;
  requestedAction?: Bilingual;
  /** Only indicators whose `evidence` is a real substring of the text, or that are marked inferred. */
  indicators: Indicator[];
  recommendedActions: Bilingual[];
  limitations: Bilingual[];
};

export type AggregateInput = {
  kind: AnalysisKind;
  rules: RuleOutput;
  urlChecks: UrlCheck[];
  fileCheck?: FileCheck;
  ai?: ValidatedAi | null;
  checks: CheckStatus[];
};

export type AggregateOutput = {
  riskLevel: RiskLevel;
  uiState: UiState;
  score: number;
  categories: ScamCategory[];
  evidenceConfidence: "low" | "medium" | "high";
};

// ----------------------------------------------------------------- result

export type AnalysisResult = {
  /** Random id. Never derived from the content. */
  id: string;
  kind: AnalysisKind;
  createdAt: string; // ISO
  riskLevel: RiskLevel;
  uiState: UiState;
  /** Internal product score. The UI must NOT show it as a percentage or probability. */
  score: number;
  categories: ScamCategory[];
  summary: Bilingual;
  requestedAction?: Bilingual;
  indicators: Indicator[];
  urlChecks: UrlCheck[];
  fileCheck?: FileCheck;
  phone?: PhoneDescription;
  phoneReputation?: PhoneReputationResult;
  recommendedActions: Bilingual[];
  limitations: Bilingual[];
  evidenceConfidence: "low" | "medium" | "high";
  /** Which checks ran, so the UI can distinguish "unavailable" from "clean". */
  checks: CheckStatus[];
  /** True when the AI layer contributed. */
  aiUsed: boolean;
};

// -------------------------------------------------------------------- API

export type ApiErrorCode = "invalid_input" | "too_long" | "rate_limited" | "server_error";

export type ApiOk = { ok: true; result: AnalysisResult };
export type ApiErr = { ok: false; error: { code: ApiErrorCode; message: Bilingual } };
export type ApiResponse = ApiOk | ApiErr;

/** Picture-to-text (OCR). The image is sent as base64 (no "data:" prefix), already re-encoded by the browser. */
export type OcrRequest = { image: string; mimeType: "image/jpeg" | "image/png" | "image/webp" };
export type OcrResponse = { ok: true; text: string; noText: boolean } | ApiErr;

export type MessageRequest = { text: string; lang?: Lang; simulateOutage?: boolean };
export type UrlRequest = { url: string; simulateOutage?: boolean };
export type PhoneRequest = {
  number: string;
  context?: { channel?: PhoneChannel; description?: string };
  simulateOutage?: boolean;
};
/** What kind of file it is, guessed in the browser from the file name. Used only to tailor the advice. */
export type FileKindHint = "app" | "program" | "archive" | "document" | "other";
export type FileRequest = { sha256: string; fileType?: FileKindHint; simulateOutage?: boolean };

export const LIMITS = {
  /** Maximum characters accepted for a pasted message. */
  messageMaxChars: 5000,
  messageMinChars: 8,
  urlMaxChars: 2048,
  phoneDescriptionMaxChars: 1000,
  /** Maximum decoded size of an image sent for OCR (Vercel functions cap request bodies at about 4.5 MB). */
  ocrMaxImageBytes: 3_000_000,
} as const;
