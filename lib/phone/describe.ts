/**
 * Phone number FORMAT description and scenario guidance (spec F14).
 *
 * This module never says whether a number belongs to a scammer or is trustworthy. It only
 * describes the shape of the number and gives widely stated public-safety advice.
 *
 * HINDI REVIEW NOTE: all Hindi strings here were written by the engine author and must be
 * reviewed by a fluent Hindi speaker, and the reporting guidance should be checked against the
 * official portals (Sanchar Saathi / Chakshu, cybercrime.gov.in, 1930) at release time.
 */
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { Bilingual, PhoneChannel, PhoneDescription, PhoneKind, PhoneLineType } from "@/lib/types";
import { maskPhone } from "@/lib/privacy/redact";

const DESCRIPTIONS: Record<PhoneKind, Bilingual> = {
  indian_mobile: {
    en: "This looks like an Indian mobile number. This check cannot tell who is using it.",
    hi: "यह भारतीय मोबाइल नंबर जैसा दिखता है। यह जांच नहीं बता सकती कि इसे कौन इस्तेमाल कर रहा है।",
  },
  indian_landline: {
    en: "This looks like an Indian landline-style number with an area (STD) code, or a toll-free style number. This check cannot tell who is using it.",
    hi: "यह भारतीय लैंडलाइन जैसा नंबर (एरिया या एसटीडी कोड वाला) या टोल-फ्री जैसा नंबर दिखता है। यह जांच नहीं बता सकती कि इसे कौन इस्तेमाल कर रहा है।",
  },
  international: {
    en: "This looks like an international number (it does not start with the Indian code +91). Unexpected international calls or messages that claim to be from a local bank or an official deserve extra caution.",
    hi: "यह अंतरराष्ट्रीय नंबर जैसा दिखता है (यह भारत के कोड +91 से शुरू नहीं होता)। जो अनचाहे अंतरराष्ट्रीय कॉल या संदेश खुद को स्थानीय बैंक या किसी अधिकारी का बताएं, उनसे अतिरिक्त सावधान रहें।",
  },
  short_code: {
    en: "This looks like a short code or a sender name, not a regular phone number. A name or code on a message does not prove who really sent it.",
    hi: "यह छोटा कोड या भेजने वाले का नाम जैसा दिखता है, सामान्य फोन नंबर नहीं। संदेश पर दिखा नाम या कोड यह साबित नहीं करता कि उसे असल में किसने भेजा।",
  },
  invalid: {
    en: "We could not read this as a phone number. Please check the digits and try again.",
    hi: "हम इसे फोन नंबर के रूप में नहीं पढ़ सके। कृपया अंक जांचकर दोबारा कोशिश करें।",
  },
};

function result(kind: PhoneKind, masked: string): PhoneDescription {
  return { kind, masked, description: { ...DESCRIPTIONS[kind] } };
}

// ------------------------------------------------------------ numbering-plan facts (offline)
// libphonenumber-js ships Google's numbering-plan data with the app, so this makes NO network
// request and sends the number nowhere. It tells us the country and line type a number belongs
// to. It cannot tell who uses the number or whether it is active.

const LINE_TYPES: Record<string, PhoneLineType> = {
  MOBILE: "mobile",
  FIXED_LINE: "landline",
  FIXED_LINE_OR_MOBILE: "mobile_or_landline",
  VOIP: "voip",
  TOLL_FREE: "toll_free",
  PREMIUM_RATE: "premium",
  SHARED_COST: "shared_cost",
};

const NOT_IN_PLAN: Bilingual = {
  en: "The digits do not match any known number range for that country. Please check them. Caller numbers can also be faked.",
  hi: "ये अंक उस देश की किसी जानी-पहचानी नंबर रेंज से मेल नहीं खाते। कृपया अंक जांच लें। कॉल करने वाले का नंबर नकली भी दिखाया जा सकता है।",
};

function regionName(code: string, lang: "en" | "hi"): string {
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Add country, line type and numbering-plan facts to a description. Never throws. */
function enrich(desc: PhoneDescription, raw: string): PhoneDescription {
  if (desc.kind === "invalid" || desc.kind === "short_code") return desc;
  try {
    const parsed = parsePhoneNumberFromString(raw, "IN");
    if (!parsed) return desc;
    const out: PhoneDescription = { ...desc };
    // Show the country code (for example "+1" or "+91") even when the person typed the number
    // without it, and still hide everything except the last three digits.
    if (parsed.countryCallingCode && parsed.isPossible()) {
      const national = String(parsed.nationalNumber);
      const last3 = national.slice(-3);
      out.masked =
        parsed.countryCallingCode === "91" && national.length === 10
          ? `+91 ••••• ••${last3}`
          : `+${parsed.countryCallingCode} ${"•".repeat(Math.max(3, national.length - 3))}${last3}`;
    }
    if (parsed.country) {
      out.country = parsed.country;
      out.countryName = { en: regionName(parsed.country, "en"), hi: regionName(parsed.country, "hi") };
    }
    const type = parsed.getType();
    if (type) out.lineType = LINE_TYPES[type] ?? "other";
    out.numberPlanMatch = parsed.isValid();
    // For a valid Indian number, trust the numbering plan over our simple digit patterns, so the
    // description and the line type never disagree.
    if (out.numberPlanMatch && parsed.country === "IN" && type) {
      const kind: PhoneKind | null =
        type === "MOBILE" ? "indian_mobile" : type === "FIXED_LINE" || type === "TOLL_FREE" ? "indian_landline" : null;
      if (kind && kind !== out.kind) {
        out.kind = kind;
        out.description = { ...DESCRIPTIONS[kind] };
      }
    }
    if (!out.numberPlanMatch) {
      out.description = { en: `${desc.description.en} ${NOT_IN_PLAN.en}`, hi: `${desc.description.hi} ${NOT_IN_PLAN.hi}` };
    }
    return out;
  } catch {
    return desc;
  }
}

/** Normalize and classify a phone number or sender ID. Describes the format only. */
function describeFormat(input: string): PhoneDescription {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return result("invalid", "•••");

  // Sender-ID style (letters allowed): "AX-HDFCBK", "VM-SBIINB", "56161".
  if (/[A-Za-z]/.test(raw)) {
    // Sender IDs have no spaces ("AX-HDFCBK"); free text such as "call me" is not one.
    const compact = raw.replace(/-/g, "");
    if (/^[A-Za-z0-9]{3,11}$/.test(compact) && raw.length <= 16) return result("short_code", raw);
    return result("invalid", "•••");
  }

  // Digits with the usual separators only ("(+91) 98765-43210" is fine).
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!/^\+?[0-9]+$/.test(cleaned)) return result("invalid", "•••");
  let plus = cleaned.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!plus && digits.startsWith("00") && digits.length > 4) {
    plus = true;
    digits = digits.slice(2);
  }
  const masked = maskPhone(raw);
  if (digits.length < 3 || digits.length > 15) return result("invalid", masked);

  const classifyNational = (national: string): PhoneKind => {
    if (/^[6-9][0-9]{9}$/.test(national)) return "indian_mobile";
    if (/^[1-5][0-9]{9}$/.test(national)) return "indian_landline";
    return "invalid";
  };

  if (plus) {
    if (digits.startsWith("91")) {
      return result(classifyNational(digits.slice(2)), masked);
    }
    return digits.length >= 7 ? result("international", masked) : result("invalid", masked);
  }

  // No plus sign.
  if (digits.length === 10) {
    if (/^1(?:800|860)/.test(digits)) return result("indian_landline", masked);
    return result(classifyNational(digits), masked);
  }
  if (digits.length === 12 && digits.startsWith("91")) return result(classifyNational(digits.slice(2)), masked);
  if (digits.startsWith("0")) {
    // 0 + mobile (11 digits), or 0 + STD code + number (10-11 digits in total).
    if (digits.length === 11 && /^0[6-9]/.test(digits)) return result("indian_mobile", masked);
    if ((digits.length === 10 || digits.length === 11) && /^0[1-9]/.test(digits)) return result("indian_landline", masked);
    return result("invalid", masked);
  }
  if (/^1(?:800|860)[0-9]{6,8}$/.test(digits)) return result("indian_landline", masked);
  if (digits.length >= 3 && digits.length <= 6) return result("short_code", masked);
  return result("invalid", masked);
}

/**
 * The number in E.164 form (for example "+919876543210"), or null if it cannot be read as a
 * real phone number. Used only on the server, for the optional number-reputation lookup.
 */
export function toE164(input: string): string | null {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw || /[A-Za-z]/.test(raw)) return null;
  try {
    const parsed = parsePhoneNumberFromString(raw, "IN");
    return parsed && parsed.isPossible() ? parsed.number : null;
  } catch {
    return null;
  }
}

export function describePhone(input: string): PhoneDescription {
  const base = describeFormat(input);
  return enrich(base, typeof input === "string" ? input.trim() : "");
}

// ------------------------------------------------------------------ guidance

const CHANNEL_LINE: Record<PhoneChannel, Bilingual> = {
  call: {
    en: "If someone on a call says they are from a bank, the police, a government office or a courier, end the call. Then contact that organization using a number from its official app or website.",
    hi: "अगर कॉल करने वाला खुद को बैंक, पुलिस, सरकारी दफ्तर या कूरियर का बताए, तो कॉल काट दें। फिर उस संस्था के आधिकारिक ऐप या वेबसाइट पर दिए नंबर से खुद संपर्क करें।",
  },
  sms: {
    en: "Do not tap links or call numbers in a text message you were not expecting. Open the organization's official app or website yourself instead.",
    hi: "जिस एसएमएस की आपको उम्मीद नहीं थी, उसके लिंक न खोलें और उसमें दिए नंबर पर फोन न करें। इसके बजाय संस्था का आधिकारिक ऐप या वेबसाइट खुद खोलें।",
  },
  whatsapp: {
    en: "Do not reply to or open links from an unknown WhatsApp contact who claims to be an official, a relative or a company. A profile photo or name does not prove who it is. If you are unsure, contact the organization using a number from its official app or website.",
    hi: "व्हाट्सऐप पर अनजान व्यक्ति, जो खुद को अधिकारी, रिश्तेदार या कंपनी का बताए, उसे जवाब न दें और उसके लिंक न खोलें। प्रोफाइल फोटो या नाम से पहचान साबित नहीं होती। शक हो तो संस्था के आधिकारिक ऐप या वेबसाइट पर दिए नंबर से खुद संपर्क करें।",
  },
  other: {
    en: "If someone contacts you unexpectedly and claims to be from a bank, the police or a government office, do not act on it. Contact the organization using a number from its official app or website.",
    hi: "अगर कोई अचानक संपर्क करके खुद को बैंक, पुलिस या सरकारी दफ्तर का बताए, तो उसकी बात पर कुछ न करें। संस्था के आधिकारिक ऐप या वेबसाइट के नंबर से खुद संपर्क करें।",
  },
};

const COMMON_GUIDANCE: Bilingual[] = [
  {
    en: "Never share an OTP, UPI PIN, password or card details with anyone, even if they sound official.",
    hi: "ओटीपी, यूपीआई पिन, पासवर्ड या कार्ड की जानकारी किसी को न बताएं, चाहे वह कितना भी सरकारी या बैंक वाला लगे।",
  },
  {
    en: "Never move money to \"verify\" or \"secure\" an account. A real bank does not ask you to do this.",
    hi: "खाते को \"वेरिफाई\" या \"सुरक्षित\" करने के नाम पर पैसे न भेजें। असली बैंक ऐसा करने को नहीं कहता।",
  },
  {
    en: "Do not install an app or share your screen because someone on a call or chat asks you to.",
    hi: "कॉल या चैट पर किसी के कहने से कोई ऐप इंस्टॉल न करें और अपनी स्क्रीन साझा न करें।",
  },
  {
    en: "To report a suspected fraud call or message, use the Chakshu facility on the Sanchar Saathi website. If money was lost, call 1930 right away and tell your bank.",
    hi: "संदिग्ध ठगी वाले कॉल या संदेश की शिकायत के लिए संचार साथी वेबसाइट पर चक्षु सुविधा का इस्तेमाल करें। अगर पैसे चले गए हैं, तो तुरंत 1930 पर फोन करें और अपने बैंक को बताएं।",
  },
];

const CALLBACK_LINE: Bilingual = {
  en: "Do not call back a missed call from a number you do not know, especially an international or premium-rate one. Calling back can cost you money.",
  hi: "जिस नंबर को आप नहीं जानते, खासकर अंतरराष्ट्रीय या प्रीमियम-रेट नंबर, उससे आई मिस्ड कॉल पर वापस फोन न करें। वापस फोन करने पर आपके पैसे कट सकते हैं।",
};

/**
 * Scenario guidance for a contact by call / SMS / WhatsApp. No verdict on the number itself.
 * When the number is international, premium-rate or internet-based, a "do not call back" line is added.
 */
export function phoneGuidance(channel?: PhoneChannel, phone?: PhoneDescription): Bilingual[] {
  const first = CHANNEL_LINE[channel ?? "other"] ?? CHANNEL_LINE.other;
  const callbackRisk =
    !!phone &&
    (phone.kind === "international" || phone.lineType === "premium" || phone.lineType === "shared_cost" || phone.lineType === "voip");
  const lines = callbackRisk ? [first, CALLBACK_LINE, ...COMMON_GUIDANCE] : [first, ...COMMON_GUIDANCE];
  return lines.map((b) => ({ ...b }));
}
