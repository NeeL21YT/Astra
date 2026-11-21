/**
 * Rule data for the deterministic scam-signal engine: regex sources plus the bilingual
 * explanation that is paired with every rule (spec F07: every rule owns its English and
 * Hindi reason).
 *
 * HINDI REVIEW NOTE: all Hindi (Devanagari) strings and Hindi/Hinglish patterns in this file
 * were written by the engine author and must be reviewed by a fluent Hindi speaker before the
 * demo. Keep the wording plain and short for older readers.
 *
 * Pattern conventions:
 *  - Sources are plain regex strings (case-insensitive, Unicode mode). A literal space in a
 *    source means "one or more whitespace characters" (see R()).
 *  - Sources must not use `\-` outside a character class (invalid in Unicode mode).
 *  - Whole-word boundaries are added by the engine (see match-utils.ts), never written here.
 */
import type { Bilingual, IndicatorType } from "@/lib/types";
import { WORD, gapw } from "@/lib/analysis/match-utils";

/** Spaces become \s+ so that "do not share" matches across newlines and double spaces. */
export function R(s: string): string {
  return s.replace(/ /g, "\\s+");
}
const APOS = "['’]";

// ------------------------------------------------------------ explanations

export type RuleMeta = {
  id: string;
  type: IndicatorType;
  /** Boolean signal this rule sets. Several rules can share one signal. */
  signal: string;
  /** Starting weight (spec 7.3). The engine may adjust it for context. */
  points: number;
  explanation: Bilingual;
};

export const RULE_META: Record<string, RuleMeta> = {
  credential_request: {
    id: "credential_request",
    type: "credential_request",
    signal: "credential_request",
    points: 35,
    explanation: {
      en: "It asks you to give or enter a secret detail such as an OTP, PIN, password or card detail. Real banks do not ask for these in messages or calls.",
      hi: "यह आपसे ओटीपी, पिन, पासवर्ड या कार्ड की जानकारी जैसी गोपनीय बात मांग रहा है। असली बैंक संदेश या कॉल पर ये नहीं मांगते।",
    },
  },
  kyc_request: {
    id: "kyc_request",
    type: "credential_request",
    signal: "kyc_request",
    points: 15,
    explanation: {
      en: "It tells you to complete or update KYC (identity check) in a hurry. Scammers use this excuse to steal bank details.",
      hi: "यह आपसे जल्दी में केवाईसी (पहचान की जांच) पूरी करने को कह रहा है। ठग इसी बहाने से बैंक की जानकारी चुराते हैं।",
    },
  },
  payment_request: {
    id: "payment_request",
    type: "payment_request",
    signal: "payment_request",
    points: 15,
    explanation: {
      en: "It asks you to pay, send money or scan a QR code. Scanning a code or approving a request can take money out of your account.",
      hi: "यह आपसे पैसे भेजने, भुगतान करने या क्यूआर कोड स्कैन करने को कह रहा है। ऐसा करने से आपके खाते से पैसे कट सकते हैं।",
    },
  },
  advance_fee: {
    id: "advance_fee",
    type: "advance_fee",
    signal: "advance_fee",
    points: 20,
    explanation: {
      en: "It asks for a fee or deposit first, before you get a job, loan, prize or parcel. Being asked to pay first is a common scam trick.",
      hi: "यह कुछ मिलने से पहले शुल्क या जमा राशि मांग रहा है। पहले पैसे देने को कहना ठगी का आम तरीका है।",
    },
  },
  urgency: {
    id: "urgency",
    type: "urgency",
    signal: "urgency",
    points: 10,
    explanation: {
      en: "The message pushes you to act very fast. Scammers rush people so they have no time to think or check.",
      hi: "संदेश आपको बहुत जल्दी कदम उठाने के लिए दबाव डाल रहा है। ठग जल्दी करवाते हैं ताकि आप सोच-समझ या जांच न कर सकें।",
    },
  },
  threat: {
    id: "threat",
    type: "threat",
    signal: "threat",
    points: 15,
    explanation: {
      en: "It threatens that your account, SIM, service or legal standing will be blocked or harmed. This is a common way to scare people into acting.",
      hi: "इसमें खाता, सिम, सेवा या कानूनी कार्रवाई जैसी चीज़ बंद होने या नुकसान की धमकी है। लोगों को डराने का यह आम तरीका है।",
    },
  },
  prize_bait: {
    id: "prize_bait",
    type: "prize_bait",
    signal: "prize_bait",
    points: 20,
    explanation: {
      en: "It promises a prize, lottery win or reward that you did not ask for. Scammers use this bait to get your details or money.",
      hi: "इसमें ऐसा इनाम, लॉटरी या पैसा मिलने की बात है जो आपने मांगा ही नहीं। ठग इसी लालच से आपकी जानकारी या पैसे लेते हैं।",
    },
  },
  gambling_bait: {
    id: "gambling_bait",
    type: "other",
    signal: "gambling_bait",
    points: 25,
    explanation: {
      en: "It looks like a betting or casino promotion. These messages push you to deposit money with a bonus or free plays, and many such sites are unsafe or unregulated.",
      hi: "यह सट्टेबाज़ी या कैसीनो के प्रचार जैसा लगता है। ऐसे संदेश बोनस या मुफ्त प्ले का लालच देकर पैसे जमा करवाते हैं, और ऐसी कई साइटें असुरक्षित या बिना नियमन की होती हैं।",
    },
  },
  obfuscated_wording: {
    id: "obfuscated_wording",
    type: "other",
    signal: "obfuscated_wording",
    points: 12,
    explanation: {
      en: "Some words are spelled in an odd way (for example with symbols or numbers inside) so that spam filters do not recognize them. Genuine companies rarely do this.",
      hi: "कुछ शब्द अजीब तरह से लिखे हैं (जैसे अक्षरों के बीच चिह्न या अंक), ताकि स्पैम फ़िल्टर उन्हें पहचान न सकें। असली कंपनियां ऐसा कम ही करती हैं।",
    },
  },
  shortlink_prompt: {
    id: "shortlink_prompt",
    type: "link_risk",
    signal: "shortlink_prompt",
    points: 20,
    explanation: {
      en: "It asks you to tap a shortened link, so you cannot see where it really goes. Real banks and shops usually show their own web address.",
      hi: "यह आपसे छोटा किया हुआ लिंक खोलने को कहता है, इसलिए आप देख नहीं सकते कि वह असल में कहां ले जाएगा। असली बैंक और दुकानें आमतौर पर अपना खुद का वेब पता दिखाती हैं।",
    },
  },
  refund_bait: {
    id: "refund_bait",
    type: "prize_bait",
    signal: "refund_bait",
    points: 15,
    explanation: {
      en: "It talks about a refund you can claim. Scammers use fake refunds to make you share details or approve a payment.",
      hi: "इसमें रिफंड पाने की बात है। ठग नकली रिफंड के बहाने जानकारी या भुगतान की मंज़ूरी लेते हैं।",
    },
  },
  install_request: {
    id: "install_request",
    type: "install_request",
    signal: "install_request",
    points: 25,
    explanation: {
      en: "It asks you to install an APK file, or to use a remote-access app or share your screen. This can let a stranger control your phone and bank apps.",
      hi: "यह आपसे एपीके फाइल इंस्टॉल करने, रिमोट ऐप चलाने या स्क्रीन साझा करने को कह रहा है। इससे कोई अजनबी आपके फोन और बैंक ऐप पर कब्ज़ा कर सकता है।",
    },
  },
  install_app_link: {
    id: "install_app_link",
    type: "install_request",
    signal: "install_request",
    points: 15,
    explanation: {
      en: "It asks you to download and install an app from a link. Install apps only from the official Play Store or App Store.",
      hi: "यह आपसे लिंक से कोई ऐप डाउनलोड और इंस्टॉल करने को कह रहा है। ऐप केवल आधिकारिक प्ले स्टोर या ऐप स्टोर से ही इंस्टॉल करें।",
    },
  },
  impersonation: {
    id: "impersonation",
    type: "impersonation",
    signal: "impersonation",
    points: 15,
    explanation: {
      en: "The sender claims to be from a bank, government office, police, courier or company. Anyone can claim this in a message or call.",
      hi: "भेजने वाला खुद को बैंक, सरकारी विभाग, पुलिस, कूरियर या कंपनी का बता रहा है। संदेश या कॉल में कोई भी ऐसा दावा कर सकता है।",
    },
  },
  secrecy: {
    id: "secrecy",
    type: "secrecy",
    signal: "secrecy",
    points: 10,
    explanation: {
      en: "It tells you to keep this secret from family, friends or the bank. Scammers say this so that nobody can warn you.",
      hi: "यह आपसे परिवार, दोस्तों या बैंक से यह बात छिपाने को कह रहा है। ठग ऐसा इसलिए कहते हैं कि कोई आपको सावधान न कर सके।",
    },
  },
  isolation: {
    id: "isolation",
    type: "isolation",
    signal: "isolation",
    points: 10,
    explanation: {
      en: "It tells you to stay on the call, stay on video, or move to another chat app. This keeps you from asking anyone for help.",
      hi: "यह आपसे कॉल या वीडियो पर बने रहने, या दूसरे चैट ऐप पर आने को कह रहा है। इससे आप किसी से मदद नहीं ले पाते।",
    },
  },
  job_task: {
    id: "job_task",
    type: "other",
    signal: "job_task",
    points: 20,
    explanation: {
      en: "It offers easy money for simple tasks or work from home. Job and task scams usually ask you to pay money later.",
      hi: "इसमें आसान कामों या घर बैठे काम के बदले आसान कमाई का वादा है। नौकरी और टास्क की ठगी में आमतौर पर बाद में पैसे मांगे जाते हैं।",
    },
  },
  investment: {
    id: "investment",
    type: "other",
    signal: "investment",
    points: 20,
    explanation: {
      en: "It promises guaranteed or very high returns, or an insider tip. No real investment can guarantee a profit.",
      hi: "इसमें पक्के या बहुत ज़्यादा मुनाफे या अंदर की खबर का वादा है। कोई भी असली निवेश मुनाफे की गारंटी नहीं दे सकता।",
    },
  },
  loan_bait: {
    id: "loan_bait",
    type: "other",
    signal: "loan_bait",
    points: 10,
    explanation: {
      en: "It offers a loan that is already approved or needs almost no checks. Fake loan offers often ask for fees or personal details.",
      hi: "इसमें पहले से मंज़ूर या बिना जांच के लोन की बात है। नकली लोन ऑफर में अक्सर शुल्क या निजी जानकारी मांगी जाती है।",
    },
  },
  family_emergency: {
    id: "family_emergency",
    type: "other",
    signal: "family_emergency",
    points: 20,
    explanation: {
      en: "Someone says they are a family member with a new number or in trouble and needs help. Call that person on the number you already have before doing anything.",
      hi: "कोई खुद को परिवार का सदस्य बताकर नया नंबर या मुसीबत की बात कह रहा है। कुछ भी करने से पहले उस व्यक्ति को उसके पुराने नंबर पर फोन करके पूछें।",
    },
  },
  sextortion: {
    id: "sextortion",
    type: "threat",
    signal: "sextortion",
    points: 35,
    explanation: {
      en: "It threatens to share private photos or videos unless you pay. This is blackmail. You have done nothing wrong, so do not pay.",
      hi: "इसमें निजी फोटो या वीडियो दिखाने की धमकी देकर पैसे मांगे जा रहे हैं। यह ब्लैकमेल है। गलती आपकी नहीं है, इसलिए पैसे न दें।",
    },
  },
  fake_support_number: {
    id: "fake_support_number",
    type: "other",
    signal: "fake_support",
    points: 15,
    explanation: {
      en: "It gives a mobile number to call as 'customer care' or 'support'. Numbers sent in messages are often fake. Use the number on the official website or app.",
      hi: "इसमें 'कस्टमर केयर' या 'सपोर्ट' के नाम पर फोन करने के लिए मोबाइल नंबर दिया गया है। संदेश में भेजे नंबर अक्सर नकली होते हैं। आधिकारिक वेबसाइट या ऐप का नंबर इस्तेमाल करें।",
    },
  },
  click_link_prompt: {
    id: "click_link_prompt",
    type: "other",
    signal: "click_link_prompt",
    points: 5,
    explanation: {
      en: "It asks you to tap or open a link. Do not open links from messages you were not expecting.",
      hi: "यह आपसे लिंक खोलने को कह रहा है। जिस संदेश की आपको उम्मीद नहीं थी, उसके लिंक न खोलें।",
    },
  },
  checker_instruction: {
    id: "checker_instruction",
    type: "other",
    signal: "checker_instruction",
    points: 5,
    explanation: {
      en: "The text contains instructions aimed at an automated checker, such as telling it what result to give. They were ignored and the message was checked like any other.",
      hi: "इस लिखे हुए में जांच करने वाले सिस्टम के लिए निर्देश हैं, जैसे उसे कौन-सा नतीजा देना है। उन्हें नहीं माना गया और संदेश की सामान्य जांच की गई।",
    },
  },
};

// ------------------------------------------------------ credential request

/** Things that are secret. Longer phrases first is not required (the engine backtracks). */
export const CRED_OBJECTS = [
  R(String.raw`upi pin`),
  R(String.raw`upi m-?pin`),
  R(String.raw`m-?pin`),
  R(String.raw`atm pin`),
  R(String.raw`(?:debit|credit) card pin`),
  R(String.raw`(?:net\s*banking|transaction|secret|login|card) pin`),
  String.raw`pin(?!\s*-?\s*code(?![${WORD}]))`,
  String.raw`cvv2?`,
  String.raw`cvc`,
  String.raw`passwords?`,
  String.raw`pass ?codes?`,
  R(String.raw`one[- ]time[- ]pass(?:word|code)`),
  String.raw`o\.?t\.?p`,
  R(String.raw`(?:verification|security|authentication|auth|confirmation|secret|login|sms) code`),
  R(String.raw`card (?:number|no\.?|details|info|information|expiry(?: date)?)`),
  R(String.raw`expiry date`),
  R(String.raw`(?:debit|credit|atm) card(?: number| details| info)?`),
  R(String.raw`aadh?aar(?: number| no\.?| card| details| otp)?`),
  R(String.raw`pan(?: card)? (?:number|no\.?|details)`),
  R(String.raw`(?:net\s*banking|internet banking|mobile banking) (?:id|user\s*id|password|credentials|details|login)`),
  R(String.raw`login (?:id|details|credentials|password)`),
  R(String.raw`(?:bank )?account (?:number|no\.?|details|password)`),
  R(String.raw`bank (?:details|password|login)`),
  R(String.raw`code (?:you|that you|which you) (?:received|get|got|have received)`),
  R(String.raw`code (?:sent|received|shared) (?:to|on) your (?:phone|mobile|number)`),
  // Hindi (Devanagari)
  R(`ओटीपी`),
  R(`ओ टी पी`),
  R(`वन टाइम पासवर्ड`),
  R(`(?:वेरिफिकेशन|सत्यापन|सिक्योरिटी) कोड`),
  R(`(?:यूपीआई|यू पी आई|एटीएम|कार्ड) पिन`),
  String.raw`पिन(?!\s*-?\s*कोड(?![${WORD}]))`,
  R(`सीवीवी`),
  R(`सी वी वी`),
  R(`पासवर्ड`),
  R(`पासकोड`),
  R(`कार्ड (?:नंबर|नम्बर|की जानकारी|का विवरण|विवरण|डिटेल)`),
  R(`आधार (?:नंबर|नम्बर|कार्ड)`),
  R(`पैन (?:नंबर|नम्बर|कार्ड)`),
  R(`खाता (?:नंबर|नम्बर)`),
  R(`बैंक (?:विवरण|की जानकारी|डिटेल)`),
  R(`गुप्त कोड`),
];

/** Verbs that, placed before a secret, mean "hand it to me". */
export const CRED_VERBS_PRE = [
  "share", "send", "tell", "give", "provide", "enter", "type", "submit", "reply", "respond", "forward",
  "read out", "read", "confirm", "verify", "update", "fill in", "fill", "input", "key in", "dictate",
  "disclose", "text", "whatsapp", "mention", "say", "pass", "upload", "post", "furnish", "need", "needs",
  "require", "requires", "want", "revert", "put",
  "by sharing", "by entering", "by sending", "by providing", "by submitting", "by telling", "by giving",
  "by confirming", "by verifying",
];

/** Hindi/Hinglish verbs that follow the secret ("OTP batao", "ओटीपी बताएं"). */
export const CRED_VERBS_POST = [
  // Devanagari
  "बताएं", "बताएँ", "बतायें", "बताइए", "बताइये", "बताओ", "बता दें", "बता दो", "बताना",
  "दें", "दीजिए", "दीजिये", "देना", "दे दो", "दे दें", "दे दीजिए",
  "भेजें", "भेजिए", "भेजिये", "भेजो", "भेज दें", "भेज दो", "भेजना",
  "साझा करें", "साझा कीजिए", "साझा करना", "शेयर करें", "शेयर कीजिए", "शेयर करना",
  "डालें", "डालिए", "डालो", "दर्ज करें", "दर्ज कीजिए", "भरें", "भरिए",
  "बोलें", "बोलिए", "बोलो", "लिखें", "लिखिए",
  "सत्यापित करें", "कन्फर्म करें", "वेरीफाई करें", "वेरिफाई करें", "अपडेट करें",
  "रिप्लाई करें", "जवाब दें", "प्रदान करें", "उपलब्ध कराएं", "उपलब्ध करवाएं",
  // Hinglish
  "batao", "bataiye", "bataye", "batayein", "batayen", "bata do", "bata dijiye", "bata de", "batana", "batani",
  "bhejo", "bhejiye", "bhej do", "bhejein", "bhejen", "bhejna",
  "share karo", "share kare", "share karen", "share karein", "share kijiye", "share karna",
  "dena", "dijiye", "de do", "de dijiye", "dalo", "daliye", "daaliye", "daalo",
  "enter karo", "enter karein", "enter kare", "enter kijiye",
  "bolo", "boliye", "likho", "likhiye",
  "verify karo", "verify karein", "confirm karo", "confirm karein", "update karo", "update karein",
  "provide karo", "provide karein", "send karo", "send karein", "send kare",
];

const objAlt = CRED_OBJECTS.join("|");
const verbPreAlt = CRED_VERBS_PRE.map(R).join("|");
const verbPostAlt = CRED_VERBS_POST.map(R).join("|");

export const CREDENTIAL_PATTERNS = [
  // verb ... secret (English)
  // (The lookahead keeps "send the OTP spreadsheet" or "share the password policy" out: there the
  // secret word is only part of an ordinary noun phrase.)
  String.raw`(?:${verbPreAlt})(?![${WORD}])(?!\s+you(?![${WORD}]))${gapw(40)}(?:${objAlt})(?!\s+(?:spreadsheets?|sheets?|reports?|files?|documents?|docs?|lists?|logs?|data|templates?|polic(?:y|ies)|modules?|service|features?|api|integrations?|screens?|flows?|tickets?|bugs?|projects?|vendors?|servers?|systems?|dashboards?)(?![${WORD}]))`,
  // secret ... verb (Hindi / Hinglish word order)
  String.raw`(?:${objAlt})${gapw(30)}(?:${verbPostAlt})`,
  // "OTP required"
  String.raw`(?:${objAlt})(?:\s+(?:is|are))?\s+(?:required|needed|mandatory|necessary|compulsory)`,
];

/** An OTP that is simply being delivered ("Enter OTP 482913 to log in") is not a request for yours. */
export const OTP_DELIVERED = new RegExp(
  String.raw`(?:otp|code|ओटीपी|कोड)[^.!?\n0-9]{0,25}?[0-9]{4,8}(?![0-9])|(?:^|[^0-9])[0-9]{4,8}(?![0-9])[^.!?\n]{0,25}?(?:otp|code|ओटीपी|कोड)`,
  "iu",
);
export const ENTRY_VERB = /^(?:enter|type|input|key\s+in|submit|use|put|fill|डालें|दर्ज)/i;
/** Credential object detector (used to keep secrecy rules off safety advice about OTPs). */
export const CRED_OBJECT_ANY = `(?:${objAlt})`;

// -------------------------------------------------------------- KYC request

export const KYC_PATTERNS = [
  String.raw`(?:complete|completing|update|updating|verify|verifying|finish|renew|re-?verify|submit|upload|confirm|redo|do|done)\s+(?:(?:your|the|ur|a|full|video|new|pending)\s+)*(?:e-?)?kyc`,
  String.raw`kyc\s+(?:update|updation|verification|verify|re-?verification|details|process|form|completion|formalities|pending)`,
  String.raw`(?:update|verify|link)\s+(?:your\s+)?(?:pan|aadh?aar)(?:\s+card)?\s+(?:details|number|now|immediately|today|with|to)`,
  // Hindi
  String.raw`केवाईसी\s+(?:अपडेट|वेरिफिकेशन|वेरीफिकेशन|सत्यापन|पूरा|पूरी|वेरिफाई)?\s*(?:करें|करो|करिए|कीजिए|कराएं|करवाएं|करना|जमा|अपडेट|पूरा करें|पूरी करें)`,
  String.raw`(?:अपना\s+)?केवाईसी\s+(?:अपडेट|पूरा|पूरी|वेरिफाई)`,
  // Hinglish
  String.raw`kyc\s+(?:update\s+|verify\s+|complete\s+|verification\s+)?(?:karo|karein|kare|karen|kijiye|karna|karwao|karao|karwana|karwa)`,
];

// ------------------------------------------------------------------ payment

const MONEY = String.raw`(?:(?:rs\.?|inr|₹)\s*[0-9][0-9,]*(?:\.[0-9]+)?|[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:rs|rupees|inr|₹)|amount|fees?|charges?|money|payment|balance|dues?|penalty|fine|deposit|bill)`;

export const PAYMENT_PATTERNS = [
  String.raw`(?:pay|send|transfer|deposit|remit|wire)(?![${WORD}])\s+(?:me\s+|us\s+|him\s+|them\s+|the\s+|a\s+|an\s+|your\s+|this\s+|that\s+|only\s+)*${MONEY}`,
  String.raw`pay(?:\s+(?:now|immediately|today|online|here|instantly|urgently|first))`,
  String.raw`(?:make|complete|do|process)\s+(?:the\s+|a\s+|your\s+|this\s+)?(?:payment|transaction|transfer)`,
  String.raw`scan\s+(?:the\s+|this\s+|attached\s+|below\s+|our\s+|that\s+|given\s+)?(?:qr|bar\s*code)(?:\s*code)?`,
  String.raw`(?:approve|accept|authori[sz]e|confirm)\s+(?:the\s+|this\s+|a\s+|that\s+|any\s+)?(?:upi\s+)?(?:collect|payment|mandate|debit)(?:\s+request)?`,
  String.raw`(?:click|tap)\s+(?:on\s+)?(?:the\s+)?(?:link\s+)?to\s+pay`,
  String.raw`pay\s+(?:via|using|through|by)\s+(?:the\s+|this\s+)?(?:link|upi|qr|gpay|google\s+pay|phonepe|paytm)`,
  // Hindi
  String.raw`(?:₹|रु\.?|रुपये|रुपए|पैसे|राशि|शुल्क|फीस|रकम)[^.!?\n।]{0,25}?(?:भेजें|भेजो|भेजिए|भेज\s+दो|भेज\s+दें|ट्रांसफर\s+करें|जमा\s+करें|जमा\s+कराएं|जमा\s+करवाएं|भुगतान\s+करें|चुकाएं|दें|दो)`,
  String.raw`(?:भुगतान|पेमेंट)\s+(?:करें|करो|कीजिए|कर\s+दें)`,
  String.raw`(?:क्यूआर|क्यू\s*आर|QR)\s*कोड\s+(?:को\s+)?स्कैन\s+(?:करें|करो|कीजिए)`,
  String.raw`(?:कलेक्ट|पेमेंट)\s+रिक्वेस्ट\s+(?:को\s+)?(?:स्वीकार|अप्रूव|मंजूर)\s+(?:करें|करो)`,
  // Hinglish
  String.raw`(?:paise|paisa|rupaye|rupay|payment|rs\.?\s*[0-9][0-9,]*(?:\s+(?:fee|fees|charge|charges|shulk))?)\s+(?:bhejo|bhejiye|bhej\s+do|bhejein|bhejen|transfer\s+karo|jama\s+karo|karo|karein|kare|bharo)`,
  String.raw`(?:qr\s+code|qr)\s+scan\s+(?:karo|karein|kare|kijiye)`,
];

export const ADVANCE_FEE_PATTERNS = [
  String.raw`(?:processing|registration|release|customs|clearance|handling|redelivery|re-delivery|verification|activation|refundable|legal|admission|joining|document|file|insurance|unlock|withdrawal)\s+(?:fees?|charges?|deposit|amount|payment)`,
  String.raw`security\s+deposit`,
  String.raw`advance\s+(?:payment|fees?|amount|charges?|deposit)`,
  String.raw`token\s+(?:amount|money)`,
  String.raw`refundable\s+(?:deposit|amount|fees?)`,
  String.raw`(?:small|nominal|minimal|minimum)\s+(?:fees?|amount|charges?|payment|deposit)`,
  // Hindi
  String.raw`(?:प्रोसेसिंग|रजिस्ट्रेशन|पंजीकरण|रिलीज़?|कस्टम(?:्स)?|क्लियरेंस|हैंडलिंग|सत्यापन|वेरिफिकेशन|एक्टिवेशन|रिफंडेबल|सिक्योरिटी|जॉइनिंग|दस्तावेज़?)\s+(?:शुल्क|फीस|चार्ज|जमा|राशि|डिपॉजिट|रकम)`,
  String.raw`सिक्योरिटी\s+डिपॉजिट`,
  String.raw`एडवांस\s+(?:पेमेंट|राशि|फीस|भुगतान)`,
  String.raw`टोकन\s+(?:राशि|मनी)`,
  // Hinglish
  String.raw`(?:processing|registration|release|customs|clearance|handling|verification|activation|security)\s+(?:fee|fees|charge|charges|deposit)\s+(?:bharo|bhejo|jama|dena|deni|dijiye)`,
  String.raw`advance\s+(?:payment|fee)\s+(?:bharo|bhejo|dena|dijiye)`,
];
/** An advance-fee phrase only counts when the clause also asks for / states an amount. */
export const FEE_REQUESTED = /pay|send|deposit|transfer|remit|required|mandatory|pending|\bdue\b|applicable|charged|rs\.?\s*\d|₹|\d+\s*(?:rs|rupees|inr)|inr|भेज|जमा|भुगतान|चुकाएं|रुपये|रु\.|₹|bharo|bhejo|jama|dena/iu;
/** "No processing fee", "zero fee" are not requests. */
export const FEE_NEGATION = /\b(?:no|zero|nil|without|free\s+of|never)\b|कोई\s+(?:शुल्क|फीस)\s+नहीं|बिना|नहीं/iu;

// ------------------------------------------------- betting and casino promotions

export const GAMBLING_PATTERNS = [
  String.raw`(?:free|bonus)\s+(?:plays?|spins?|bets?|credits?|chips?)`,
  String.raw`free\s*bets?|freebets?|live\s+bet|place\s+(?:a\s+)?bet|bet\s+now|sports\s+bonus`,
  // "10 FS" (free spins) and "100 FB" (free bets): the number in front keeps "FB" from matching Facebook
  String.raw`[0-9]+\s*(?:fs|fb)(?![a-z0-9])`,
  String.raw`win\s+up\s+to\s+[0-9][0-9,]*\s*x`,
  String.raw`win\s+[0-9][0-9,]*\s*(?:inr|rs\.?)\b`,
  String.raw`(?:exclusive|deposit|welcome)\s+(?:bonus|package)`,
  String.raw`[0-9]{2,3}\s*%\s*(?:welcome\s+)?(?:bonus|real\s+money|cashback)`,
  String.raw`(?:bonus|cashback)\s+up\s+to`,
  String.raw`(?:bonus|cashback)[^.!?\n]{0,60}?(?:deposit|top[-\s]?up|fund\s+your|your\s+balance)`,
  String.raw`(?:deposit|top[-\s]?up|fund\s+your\s+balance|add)\s+(?:from\s+|of\s+)?(?:rs\.?\s*|₹\s*|inr\s*)?[0-9][0-9,]*[^.!?\n]{0,50}?(?:bonus|cashback|free\s+(?:bet|plays?|spins?)|win)`,
  String.raw`wager\s*x?\s*[0-9]+`,
  String.raw`double\s+your\s+money`,
  String.raw`(?:super\s*prize|prize)\s+draw`,
  String.raw`jump\s+back\s+into\s+the\s+action|funds\s+left\s+in\s+your\s+account`,
  String.raw`aviator|lucky\s+(?:jet|wheel|star)|chicken\s+road|royalty\s+of\s+olympus|fortune\s+garuda`,
  String.raw`casino|betting|sportsbook|satta|matka|online\s+slots?|slot\s+(?:games?|machines?)`,
  String.raw`1win|1xbet|4rabet|betway|betwinner|dafabet|parimatch|bet365|mostbet|melbet|fairplay|lotus365|jeetwin|rajabets|babu88|22bet|roobet|tez888|pin-?up|maxwin`,
  // Hindi and Hinglish
  String.raw`बोनस|सट्टा|कैसीनो|बेटिंग|डिपॉजिट|फ्री\s+स्पिन|मुफ्त\s+(?:स्पिन|बेट)|जमा\s*=\s*[0-9]+`,
  String.raw`[0-9]+\s*%\s*ka\s+(?:gift|bonus)|gift\s+pehle\s+se\s+hi|jeet\s+wali\s+bets?|top-?up\s+ke\s+lie`,
];

// ------------------------------------------------ obfuscated (disguised) wording
// Letters swapped for symbols or digits inside words that spam filters look for.

export const OBFUSCATION_PATTERNS = [
  String.raw`passw0rd|p@ssw[o0]rd|p@ssword|pa55w[o0]rd`,
  String.raw`re[_\-.]set|ver[_\-.]ify|ac[_\-.]count|u[_\-.]pdate|l[0o]g[_\-.]in`,
  String.raw`acc0unt|l0gin|verif[1!]cation|0tp`,
  String.raw`d3p[o0]s[i1]t|dep0s[i1]t|d[@3]ily|b0nus(?:es)?|pr[o0]m[o0]\s+c[o0]des?|c0des?`,
];

// ---------------------------------------- "click / view / track" followed by a shortened link

export const SHORTLINK_PROMPT_PATTERNS = [
  String.raw`(?:click|tap|view|visit|open|track|check|claim|withdraw|download)\b[^.!?\n]{0,45}?(?:https?://)?(?:www\.)?(?:bit\.ly|bitly\.com|tinyurl\.com|cutt\.ly|rb\.gy|t\.co|goo\.gl|is\.gd|shorturl\.at|ow\.ly|buff\.ly|tiny\.cc|ln\.run|slim\.link|cli\.co|lshrt\.me|t2m\.co|clck\.ru)/[^\s]+`,
];

// ------------------------------------------------------------------ urgency

export const URGENCY_PATTERNS = [
  String.raw`keep\s+your\s+(?:cibil|credit)\s+score\s+safe|due\s+today`,
  String.raw`immediately|urgent(?:ly)?|right\s+now|right\s+away|asap|at\s+once|without\s+delay|straight\s+away|instantly|as\s+soon\s+as\s+possible|hurry(?:\s+up)?|act\s+(?:now|fast|quickly)|do\s+it\s+(?:now|today)`,
  String.raw`(?:last|final)\s+(?:chance|day|date|reminder|opportunity|warning|notice)`,
  String.raw`within\s+(?:the\s+next\s+)?[0-9]{1,3}\s*(?:minutes?|mins?|hours?|hrs?|days?)`,
  String.raw`(?:in|within)\s+(?:the\s+next\s+)?(?:a\s+few|one|two|three|few)\s+(?:minutes?|mins?|hours?|hrs?)`,
  String.raw`limited\s+(?:time|period)|today\s+only|before\s+(?:midnight|tonight)|by\s+(?:midnight|tonight|end\s+of\s+(?:the\s+)?day)`,
  String.raw`do\s+not\s+(?:ignore|delay|wait|miss)|don${APOS}t\s+(?:ignore|delay|wait|miss)|dont\s+(?:ignore|delay|wait|miss)`,
  String.raw`failure\s+to\s+(?:comply|respond|act|update|verify|complete)|time\s+is\s+running\s+out|quickly|promptly`,
  // "today" only counts next to a threat verb ("blocked today"); evidence is just the last word
  String.raw`(?:block(?:ed)?|suspend(?:ed)?|clos(?:e|ed)|disconnect(?:ed)?|deactivat(?:e|ed)|terminat(?:e|ed)|expire[sd]?|lapse[sd]?|cancel(?:l?ed)?)[^.!?\n]{0,25}?[^${WORD}.!?\n](?<ev>today|tonight)`,
  // Hindi
  String.raw`तुरंत|फौरन|फ़ौरन|अभी(?!\s+तक)|जल्दी|जल्द\s+से\s+जल्द|तत्काल|शीघ्र|आज\s+ही|आज\s+रात|अभी\s+के\s+अभी|देर\s+(?:न|ना|मत)\s+करें|आखिरी\s+मौका|आख़िरी\s+मौका|अंतिम\s+(?:मौका|तिथि|चेतावनी)|[0-9]+\s*घंटे\s*(?:में|के\s+अंदर|के\s+भीतर)|[0-9]+\s*मिनट\s*(?:में|के\s+अंदर)`,
  // Hinglish
  String.raw`turant|foran|fauran|tatkal|jaldi|jald\s+se\s+jald|aaj\s+hi|der\s+mat\s+karo|der\s+na\s+karein|abhi\s+(?:ke\s+abhi|karo|karein|kare|update|verify|call|click|bhejo|batao|pay)`,
];
/** "expires in 10 minutes" next to an OTP is normal for genuine OTP messages. */
export const URGENCY_EXPIRES = String.raw`(?:expires?|expiring|expired|valid)\s+(?:in|within|today|tonight|soon)|offer\s+(?:will\s+)?expires?|link\s+(?:will\s+)?expires?`;
export const OTP_WORDS = /\b(?:otp|code|password|pin|cvv)\b|ओटीपी|कोड/iu;

// ------------------------------------------------------------------- threat

const THREAT_NOUN = [
  String.raw`(?:(?:bank|savings|current|sbi|hdfc|icici|paytm|upi|google\s+pay|phonepe|axis|kotak|pnb)\s+)?(?:account|a/c|acct)`,
  String.raw`sim(?:\s+card)?`,
  String.raw`(?:mobile|phone)\s+(?:number|connection|service)`,
  String.raw`number|connection|electricity(?:\s+(?:connection|supply|service))?|power(?:\s+(?:supply|connection))?`,
  String.raw`gas(?:\s+connection)?|water(?:\s+connection)?|(?:(?:credit|debit|atm)\s+)?card|upi(?:\s+id|\s+service)?`,
  String.raw`wallet|paytm|kyc|pan(?:\s+card)?|aadh?aar(?:\s+card)?|licen[cs]e|loan|policy|insurance|fastag|demat(?:\s+account)?`,
  String.raw`net\s*banking|internet\s+banking|(?:your|the)\s+services?|membership|whatsapp(?:\s+account)?|email(?:\s+account)?`,
].join("|");
const THREAT_STATUS = String.raw`(?:(?:will|shall|would|may|might|can|could|is|are|has|have|been|being|get|gets|to)\s+(?:be\s+|been\s+|get\s+|being\s+|going\s+to\s+be\s+|about\s+to\s+be\s+)?)?(?:permanently\s+|temporarily\s+|immediately\s+|automatically\s+|totally\s+)?(?:blocked|suspended|closed|deactivated|disconnected|terminated|frozen|cancell?ed|disabled|barred|locked|restricted|expired|deleted|revoked|cut\s+off|cut|discontinued|inactive|dormant)`;
const THREAT_NOUN_HI = String.raw`खाता|खाते|अकाउंट|एकाउंट|सिम|मोबाइल\s+नंबर|नंबर|कनेक्शन|बिजली(?:\s+कनेक्शन)?|कार्ड|यूपीआई|वॉलेट|केवाईसी|पैन\s+कार्ड|आधार|लाइसेंस|लोन|पॉलिसी|बीमा|सेवाएं|सेवा|गैस\s+कनेक्शन|नेट\s+बैंकिंग|बैंक\s+खाता`;
const THREAT_STATUS_HI = String.raw`(?:बंद|बन्द|ब्लॉक|ब्लाक|सस्पेंड|निलंबित|रद्द|कैंसिल|समाप्त|एक्सपायर|निष्क्रिय|फ्रीज़?|डिएक्टिवेट|डिसकनेक्ट|लॉक)(?:\s+कर\s+दि(?:या|ए|ये)\s+जा(?:एगा|एगी|एंगे|येगा|येगी)|\s+कर\s+दी\s+जा(?:एगी|येगी)|\s+कर\s+दि(?:या|ए)\s+(?:गया|गए|गये)|\s+कर\s+दी\s+गई|\s+हो\s+जा(?:एगा|एगी|एंगे|येगा|येगी|एँगे)|\s+हो\s+(?:गया|गई|गयी|गए)|\s+हो\s+सकत(?:ा|ी)\s+है|\s+होगा|\s+होगी)|(?:कट|काट)\s+(?:दी|दिया)\s+जा(?:एगी|एगा|येगी|येगा)|कट\s+जा(?:एगी|एगा|येगी|येगा)`;

export const THREAT_PATTERNS = [
  // Loss-of-access and expiry threats that do not use the usual "blocked" words
  String.raw`you\s+will\s+not\s+have\s+access[^.!?\n]{0,70}?(?:until|unless)`,
  String.raw`password[^.!?\n]{0,70}?(?:will\s+)?expire`,
  String.raw`(?:${THREAT_NOUN})${gapw(50)}${THREAT_STATUS}`,
  String.raw`kyc\s+(?:is\s+|has\s+|was\s+|will\s+be\s+)?(?:expired|expiring|pending|incomplete|not\s+(?:updated|completed|verified)|invalid|rejected)`,
  String.raw`(?:pan|aadh?aar)(?:\s+card)?\s+(?:and\s+(?:pan|aadh?aar)\s+)?(?:is\s+|are\s+)?not\s+(?:linked|updated)`,
  String.raw`legal\s+(?:action|proceedings?|notice)|court\s+(?:case|notice|summons|order|proceedings?)|criminal\s+(?:case|charges?|proceedings?)`,
  String.raw`(?:fir|f\.i\.r\.?)\s+(?:will\s+be\s+|has\s+been\s+|is\s+)?(?:registered|filed|lodged)`,
  String.raw`arrest(?:ed)?|arrest\s+warrant|warrant\s+(?:has\s+been\s+|is\s+)?issued|digital\s+arrest|house\s+arrest|money\s+laundering`,
  String.raw`illegal\s+(?:parcel|activity|transactions?|content|items?)|drugs?\s+(?:found|seized|in\s+(?:the\s+|your\s+)?parcel)`,
  String.raw`(?:case|complaint|fir)\s+(?:has\s+been\s+|is\s+|will\s+be\s+)?(?:registered|filed|lodged)\s+(?:against|on)\s+you`,
  String.raw`police\s+(?:case|complaint)|jail|imprisonment|(?:strict|severe)\s+action|face\s+(?:legal\s+|strict\s+|severe\s+)?(?:action|consequences)`,
  String.raw`(?:last|final)\s+(?:warning|notice)`,
  String.raw`avoid\s+(?:account\s+)?(?:suspension|blocking|blockage|disconnection|closure|penalty|legal\s+action|deactivation|termination)`,
  String.raw`(?:disconnection|suspension|blocking|termination)\s+(?:tonight|today|tomorrow|at|by|in|within)`,
  // Hindi
  String.raw`(?:${THREAT_NOUN_HI})[^.!?\n।]{0,40}?${THREAT_STATUS_HI}`,
  String.raw`केवाईसी[^.!?\n।]{0,20}?(?:एक्सपायर|समाप्त|अधूरा|पेंडिंग|लंबित|अमान्य)`,
  String.raw`गिरफ्तार(?:ी)?|गिरफ़्तार(?:ी)?|कानूनी\s+(?:कार्रवाई|कार्यवाही|नोटिस)|एफआईआर|अरेस्ट|वारंट|डिजिटल\s+अरेस्ट|जेल|मनी\s+लॉन्ड्रिंग|मुकदमा|कोर्ट\s+केस|पुलिस\s+केस|आखिरी\s+चेतावनी|अंतिम\s+चेतावनी|जुर्माना`,
  // Hinglish
  String.raw`(?:khata|account|a/c|sim|number|connection|bijli|card|upi|kyc|pan|aadhaar)\s+(?:[^\s.!?]+\s+){0,3}?(?:band|bandh|block|suspend|deactivate|freeze|cancel|expire|disconnect|lock)\s+(?:ho\s+(?:jayega|jayegi|jaega|jaegi|jayenge|jaenge|jaye|sakta\s+hai|sakti\s+hai|gaya|gayi)|kar\s+(?:diya|di|diye)\s+(?:jayega|jayegi|jaega|jaegi|jayenge|gaya|gayi|jaye)|hoga|hogi)`,
  String.raw`(?:bijli|connection)\s+(?:kat|cut)\s+(?:jayegi|jayega|di\s+jayegi|di\s+jayega)`,
  String.raw`giraftar(?:i)?|kanooni\s+karyavahi`,
];
/** Words in a threat's own evidence that tell us what kind of thing is threatened. */
export const BANKISH = /\b(?:bank|a\/c|account|acct|khata|netbanking|net\s*banking|kyc|debit|credit|card|upi)\b|खाता|खाते|अकाउंट|बैंक|केवाईसी|कार्ड/iu;
export const UTILITYISH = /\b(?:electricity|power|bijli|gas|water|connection)\b|बिजली|गैस|पानी/iu;
export const GOVISH = /\b(?:arrest|warrant|money\s+laundering|digital\s+arrest|court|fir|legal|police|jail)\b|गिरफ्तार|गिरफ़्तार|अरेस्ट|वारंट|मनी\s+लॉन्ड्रिंग|कोर्ट|एफआईआर|कानूनी|पुलिस|जेल/iu;

// --------------------------------------------------------- prize and refund

export const PRIZE_PATTERNS = [
  String.raw`you(?:${APOS}ve|\s+have|\s+had)?\s+(?:been\s+selected|won(?!${APOS}t)|are\s+(?:the\s+)?(?:lucky\s+)?winner|are\s+selected|are\s+eligible\s+for\s+(?:a\s+)?(?:prize|reward|gift|cashback))`,
  String.raw`congratulations?[^.!?\n]{0,60}?(?:won|winner|selected|prize|reward|gift|lottery|lucky|cashback|iphone)`,
  String.raw`lucky\s+(?:draw|winner|customer)|lottery|jackpot|kbc`,
  String.raw`(?:prize|reward|gift|cashback|bonus)\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|inr\s*)[0-9][0-9,]*`,
  // Fake "credited / withdraw today" messages (the money was never sent; the link is the trap)
  String.raw`cash\s+back\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|inr\s*)[0-9][0-9,]*`,
  String.raw`(?:credited|received)[^.!?\n]{0,90}?withdraw`,
  String.raw`withdraw\s+(?:process|now|here|today)|click\s+(?:to\s+)?withdraw|pls\s+click\s+withdraw`,
  String.raw`(?:claim|collect|redeem)\s+(?:your\s+)?(?:prize|reward|gift|cashback|bonus|winnings?)`,
  String.raw`(?:free|win)\s+(?:iphone|gift|recharge|laptop|car|gold)`,
  // Hindi
  String.raw`इनाम|ईनाम|लॉटरी|जैकपॉट|विजेता|लकी\s+ड्रॉ|कैशबैक|मुफ्त\s+(?:गिफ्ट|रिचार्ज|आईफोन)`,
  String.raw`आपने\s+[^.!?\n।]{0,30}?जीत(?:ा|ी|े)?`,
  String.raw`बधाई[^.!?\n।]{0,40}?(?:इनाम|जीत|विजेता|लॉटरी|कैशबैक|गिफ्ट)`,
  // Hinglish
  String.raw`inaam|inam|lottery\s+(?:jeet|lagi|jeeta)|lucky\s+draw|aapne\s+[^.!?\n]{0,30}?(?:jeeta|jita|jeet)|badhai[^.!?\n]{0,40}?(?:inaam|jeet|winner|lottery)`,
];
export const REFUND_PATTERNS = [
  String.raw`refund[^.!?\n]{0,40}?(?:ready|pending|approved|eligible|waiting|due|available|stuck|on\s+hold|claim|failed)`,
  String.raw`(?:claim|get|receive|collect|confirm|verify|apply\s+for|release|unlock)\s+(?:your\s+|the\s+|a\s+)?(?:refund|rebate)`,
  String.raw`(?:income\s+tax|tax|gst|upi)\s+refund`,
  // Hindi
  String.raw`रिफंड[^.!?\n।]{0,30}?(?:तैयार|पास|मिलेगा|मिलेंगे|पाने|क्लेम|लंबित|पेंडिंग|स्वीकृत)`,
  String.raw`रिफंड\s+(?:पाने|क्लेम|प्राप्त)`,
  // Hinglish
  String.raw`refund\s+(?:ready|mil\s+jayega|milega|pending|claim)`,
];

// ------------------------------------------------------------------ install

export const INSTALL_STRONG_PATTERNS = [
  String.raw`(?:install|installing|download|downloading|open|run|click|tap|update|get|use|save|forward)(?![${WORD}])${gapw(50)}apks?`,
  String.raw`[\p{L}\p{N}_.-]+\.apk`,
  String.raw`apks?(?:\s+(?:file|link|app))?`,
  String.raw`any\s*desk|team\s*viewer|quick\s*support|rust\s*desk|air\s*droid|ultra\s*viewer|aweray|remote\s+(?:desktop|access|support|control|assistance)`,
  String.raw`screen[-\s]?shar(?:e|ing)|share\s+(?:your|the|ur)\s+screen|screen\s+mirror(?:ing)?`,
  String.raw`(?:allow|give|enable|grant)\s+(?:remote|screen)\s+(?:access|control|sharing|permission)`,
  // Hindi
  String.raw`एपीके|ए\.?\s?पी\.?\s?के`,
  String.raw`(?:ऐप|एप|एप्लिकेशन|ऐप्लिकेशन|सॉफ्टवेयर)\s+(?:को\s+)?(?:इंस्टॉल|डाउनलोड|इनस्टॉल)`,
  String.raw`(?:इंस्टॉल|डाउनलोड)\s+(?:कर(?:ें|ो|िए|ना)|कीजिए)[^.!?\n।]{0,30}?(?:ऐप|एप|एपीके)`,
  String.raw`एनी\s*डेस्क|टीम\s*व्यूअर|क्विक\s*सपोर्ट|स्क्रीन\s+(?:शेयर|साझा)\s*(?:कर|करें|करो|करना)|रिमोट\s+(?:एक्सेस|कंट्रोल|सपोर्ट)`,
  // Hinglish
  String.raw`(?:app|apk)\s+(?:download|install)\s+(?:karo|karein|kare|kijiye|karna)|screen\s+share\s+(?:karo|karein|kare|kijiye)`,
];
export const INSTALL_WEAK_PATTERNS = [
  String.raw`(?:install|download)\s+(?:this\s+|the\s+|our\s+|new\s+|attached\s+|below\s+|latest\s+|official\s+|following\s+)?(?:[\p{L}\p{N}]+\s+){0,3}?(?:app|application|software|tool)(?![${WORD}])[^.!?\n]{0,60}?(?:link|below|attached|http|whatsapp|click|tap|here)`,
];

// ------------------------------------------------------------ impersonation

export type OrgKind = "bank" | "gov" | "delivery" | "utility" | "support";

const ORGS_EN: Record<OrgKind, string> = {
  bank: [
    String.raw`sbi`, String.raw`state\s+bank(?:\s+of\s+india)?`, String.raw`hdfc(?:\s+bank)?`, String.raw`icici(?:\s+bank)?`,
    String.raw`axis(?:\s+bank)?`, String.raw`kotak(?:\s+mahindra)?(?:\s+bank)?`, String.raw`pnb`, String.raw`punjab\s+national\s+bank`,
    String.raw`bank\s+of\s+(?:baroda|india)`, String.raw`canara(?:\s+bank)?`, String.raw`union\s+bank`, String.raw`idfc(?:\s+first)?(?:\s+bank)?`,
    String.raw`yes\s+bank`, String.raw`indusind(?:\s+bank)?`, String.raw`paytm(?:\s+payments\s+bank)?`, String.raw`phonepe`,
    String.raw`google\s+pay`, String.raw`gpay`, String.raw`bhim`, String.raw`npci`, String.raw`amazon\s+pay`, String.raw`rbl\s+bank`,
    String.raw`(?:your\s+|the\s+)?bank`,
  ].join("|"),
  gov: [
    String.raw`rbi`, String.raw`reserve\s+bank(?:\s+of\s+india)?`, String.raw`trai`, String.raw`telecom\s+regulatory(?:\s+authority)?`,
    String.raw`department\s+of\s+telecom(?:munications?)?`, String.raw`dot`, String.raw`cbi`, String.raw`central\s+bureau(?:\s+of\s+investigation)?`,
    String.raw`enforcement\s+directorate`, String.raw`narcotics(?:\s+control\s+bureau)?`, String.raw`ncb`, String.raw`customs`,
    String.raw`income\s+tax`, String.raw`cyber\s*crime`, String.raw`cyber\s+cell`, String.raw`crime\s+branch`, String.raw`(?:mumbai\s+|delhi\s+|traffic\s+)?police`,
    String.raw`supreme\s+court`, String.raw`high\s+court`, String.raw`court`, String.raw`uidai`, String.raw`aadh?aar`, String.raw`epfo`, String.raw`sebi`,
    String.raw`government`, String.raw`govt`, String.raw`ministry`, String.raw`rto`, String.raw`e-?challan`,
  ].join("|"),
  delivery: [
    String.raw`india\s*post`, String.raw`speed\s+post`, String.raw`post\s+office`, String.raw`fedex`, String.raw`dhl`, String.raw`dtdc`,
    String.raw`blue\s*dart`, String.raw`delhivery`, String.raw`ecom\s+express`, String.raw`xpressbees`, String.raw`shadowfax`,
    String.raw`courier(?:\s+(?:company|service|office))?`, String.raw`delivery\s+(?:partner|agent|executive|service)`,
  ].join("|"),
  utility: [
    String.raw`electricity\s+(?:board|department|office|company|dept)`, String.raw`bijli\s+vibhag`, String.raw`power\s+(?:corporation|company|board|department)`,
    String.raw`msedcl`, String.raw`bses`, String.raw`bescom`, String.raw`tata\s+power`, String.raw`adani\s+electricity`, String.raw`torrent\s+power`,
    String.raw`discom`, String.raw`gas\s+(?:agency|company)`, String.raw`indane`, String.raw`hp\s+gas`, String.raw`bharat\s+gas`, String.raw`water\s+board`,
  ].join("|"),
  support: [
    String.raw`customer\s+(?:care|support|service)`, String.raw`tech(?:nical)?\s+support`, String.raw`help\s*line`, String.raw`help\s*desk`,
    String.raw`service\s+(?:center|centre)`, String.raw`support\s+team`, String.raw`security\s+team`, String.raw`fraud\s+(?:team|department|prevention)`,
    String.raw`verification\s+(?:team|department)`, String.raw`risk\s+(?:team|department)`,
  ].join("|"),
};

const ORGS_HI: Record<OrgKind, string> = {
  bank: String.raw`बैंक|एसबीआई|स्टेट\s+बैंक|एचडीएफसी|आईसीआईसीआई|पीएनबी|पेटीएम|फोनपे|आरबीआई|रिज़र्व\s+बैंक|रिजर्व\s+बैंक`,
  gov: String.raw`ट्राई|दूरसंचार\s+विभाग|सीबीआई|पुलिस|साइबर\s+क्राइम|साइबर\s+सेल|क्राइम\s+ब्रांच|कस्टम(?:्स)?|आयकर\s+विभाग|इनकम\s+टैक्स|नारकोटिक्स|एनसीबी|ईडी|उच्च\s+न्यायालय|सर्वोच्च\s+न्यायालय|कोर्ट|आधार\s+प्राधिकरण|यूआईडीएआई`,
  delivery: String.raw`डाक\s+विभाग|इंडिया\s+पोस्ट|कूरियर|एमेजॉन|अमेज़न|फ्लिपकार्ट|डीटीडीसी|ब्लू\s*डार्ट`,
  utility: String.raw`बिजली\s+विभाग|बिजली\s+बोर्ड|गैस\s+एजेंसी`,
  support: String.raw`कस्टमर\s+केयर|हेल्पलाइन|सपोर्ट\s+टीम`,
};
const ORGS_HG: Record<OrgKind, string> = {
  bank: String.raw`sbi|hdfc|icici|axis|kotak|pnb|bank|paytm|phonepe|rbi`,
  gov: String.raw`police|cbi|trai|customs|income\s+tax|cyber\s*crime|crime\s+branch`,
  delivery: String.raw`courier|india\s+post|dtdc|bluedart|delhivery|amazon|flipkart`,
  utility: String.raw`bijli\s+vibhag|electricity\s+board`,
  support: String.raw`customer\s+care|helpline`,
};

const ROLE_HI = String.raw`बोल\s+रहा|बोल\s+रही|बोल\s+रहे|कॉल|अधिकारी|ऑफिसर|ऑफ़िसर|मैनेजर|एग्जीक्यूटिव|एक्जीक्यूटिव|कर्मचारी|नोटिस|अलर्ट|टीम`;

export const IMPERSONATION_PATTERNS: Record<OrgKind, string[]> = (Object.keys(ORGS_EN) as OrgKind[]).reduce(
  (acc, kind) => {
    const o = ORGS_EN[kind];
    acc[kind] = [
      // "this is SBI", "calling from the income tax department"
      String.raw`(?:this\s+is|i\s+am|i${APOS}m|we\s+are|we${APOS}re|calling\s+from|called\s+from|call\s+from|message\s+from|msg\s+from|notice\s+from|alert\s+from|letter\s+from|speaking\s+from|on\s+behalf\s+of|representing|(?:an?\s+)?(?:officer|official|executive|representative|agent|inspector|manager)\s+(?:of|from|at|with))\s+(?:the\s+)?(?:${o})`,
      // "SBI customer care", "income tax department", "police officer"
      String.raw`(?:${o})(?:\s+(?:bank|limited|ltd|department|dept|office))?\s+(?:customer\s+(?:care|support|service)|officer|official|executive|team|department|dept|notice|alert|support|helpdesk|help\s+desk|authority|security|agent|inspector|manager|office|helpline|representative|cyber\s+cell|station)`,
      // "Dear SBI customer"
      String.raw`dear\s+(?:${o})(?:\s+bank)?\s+(?:customer|user|account\s+holder|valued\s+customer|cardholder|member|client|consumer)`,
      // Hindi
      String.raw`(?:${ORGS_HI[kind]})\s*(?:से|के|की|का)\s*(?:${ROLE_HI})`,
      String.raw`(?:${ORGS_HI[kind]})\s+(?:अधिकारी|ऑफिसर|मैनेजर|एग्जीक्यूटिव|विभाग|टीम|कस्टमर\s+केयर)`,
      String.raw`(?:प्रिय|डियर)\s+(?:${ORGS_HI[kind]})\s+(?:ग्राहक|उपयोगकर्ता|खाताधारक)`,
      // Hinglish
      String.raw`(?:${ORGS_HG[kind]})\s+(?:se|ki\s+taraf\s+se)\s+(?:bol\s+raha|bol\s+rahi|bol\s+rahe|call|officer|manager|executive|baat)`,
    ];
    return acc;
  },
  {} as Record<OrgKind, string[]>,
);

// ------------------------------------------------------ secrecy / isolation

export const SECRECY_PATTERNS = [
  String.raw`(?:do\s+not|don${APOS}t|dont|never|must\s+not|should\s+not|cannot|can${APOS}t)\s+(?:to\s+)?(?:tell|inform|disclose|discuss|speak|talk|reveal|mention)\s+(?:about\s+)?(?:this\s+|it\s+)?(?:to\s+|with\s+)?(?:anyone|anybody|any\s+one|others|your\s+(?:family|friends|relatives|parents|wife|husband|bank|colleagues)|family|friends|police|bank|relatives)`,
  String.raw`(?:do\s+not|don${APOS}t|dont)\s+share\s+this\s+(?:matter|case|call|conversation|information|investigation|issue)\s+with\s+(?:anyone|anybody|others)`,
  String.raw`keep\s+(?:this|it|the\s+matter|this\s+matter|this\s+call|this\s+conversation|everything)\s+(?:a\s+)?(?:secret|confidential|private|between\s+us|to\s+yourself)`,
  String.raw`strictly\s+confidential|between\s+(?:us|you\s+and\s+me)`,
  String.raw`(?:do\s+not|don${APOS}t|dont)\s+(?:contact|call|visit|consult)\s+(?:your\s+)?(?:bank|branch|police|family|lawyer|anyone)`,
  // Hindi
  String.raw`(?:किसी\s+को|किसी\s+से|किसी\s+के\s+साथ)\s*(?:भी\s+)?(?:यह\s+|ये\s+|इस\s+)?(?:बात\s+|जानकारी\s+|मामले\s+के\s+बारे\s+में\s+|मामला\s+)?(?:न|ना|मत)\s+(?:बताएं|बताएँ|बताना|बताइए|बताओ|बतायें)`,
  String.raw`(?:परिवार|घरवालों|घर\s+वालों|दोस्तों|बैंक)\s+(?:को|से)\s+(?:भी\s+)?(?:न|ना|मत)\s+(?:बताएं|बताना|बताओ|बताइए)`,
  String.raw`(?:गोपनीय|गुप्त)\s+रखें|राज़?\s+रखें`,
  // Hinglish
  String.raw`kisi\s+ko\s+(?:bhi\s+)?(?:mat|nahi|na)\s+(?:batana|batao|bataye|bataiye)|kisi\s+se\s+(?:baat|charcha)\s+(?:mat|na)\s+kar(?:na|o|ein)|(?:raaz|raz|gopniya)\s+rakhe(?:in|n)?|ghar\s+walon\s+ko\s+(?:mat|na)\s+bata(?:na|o)`,
];

export const ISOLATION_PATTERNS = [
  String.raw`(?:stay|remain|keep)\s+(?:on|connected\s+on|connected\s+to)\s+(?:the\s+|this\s+)?(?:call|line|video\s+call|phone)`,
  String.raw`(?:do\s+not|don${APOS}t|dont|never)\s+(?:disconnect|cut|end|hang\s+up|drop|leave)\s+(?:the\s+|this\s+)?(?:call|line|phone|video\s+call|video|session)`,
  String.raw`(?:do\s+not|don${APOS}t|dont)\s+(?:leave|go\s+out\s+of)\s+(?:your\s+)?(?:house|home|room)`,
  String.raw`keep\s+(?:your\s+)?camera\s+on`,
  String.raw`(?:join|add)\s+(?:our|my|the|this)\s+(?:telegram|whatsapp)\s+(?:group|channel)`,
  String.raw`(?:message|contact|text|chat\s+with|whatsapp|reach)\s+(?:me|us)\s+(?:on|at|via|through)\s+(?:telegram|whatsapp|signal)`,
  String.raw`move\s+(?:the\s+)?(?:chat|conversation)\s+to`,
  // Hindi
  String.raw`(?:कॉल|फोन|फ़ोन|लाइन)\s+(?:न|ना|मत)\s+(?:काटें|काटना|काटो|काटिए|काटिये|रखें)`,
  String.raw`(?:कॉल|फोन|लाइन)\s+पर\s+बने\s+रहें|कॉल\s+पर\s+रहें|वीडियो\s+कॉल\s+पर\s+(?:बने\s+रहें|रहें)`,
  String.raw`(?:घर|कमरे)\s+से\s+बाहर\s+(?:न|ना|मत)\s+जाएं`,
  String.raw`टेलीग्राम\s+ग्रुप\s+(?:से\s+)?जुड़ें`,
  // Hinglish
  String.raw`call\s+(?:mat|na)\s+(?:kaato|kaatna|kaatiye|kato|katna)|line\s+(?:pe|par)\s+bane\s+rahe(?:in|n)?|call\s+(?:pe|par)\s+bane\s+rahe(?:in|n)?|ghar\s+se\s+bahar\s+(?:mat|na)\s+jao`,
];

// -------------------------------------------------- job, investment, loan

export const JOB_PATTERNS = [
  String.raw`(?:easy|simple|quick|part[-\s]?time|full[-\s]?time|work[-\s]from[-\s]home|online|home[-\s]?based|data\s+entry)\s+(?:jobs?|income|work|earnings?|tasks?|opportunity)`,
  String.raw`earn\s+(?:up\s*to\s+)?(?:rs\.?\s*|₹\s*|inr\s*)?[0-9][0-9,]*\s*(?:rs|rupees|₹)?\s*(?:per|a|/|every|daily|weekly|monthly)`,
  String.raw`(?:earn|make)\s+(?:money|income|cash)\s+(?:online|from\s+home|daily|at\s+home|easily)`,
  String.raw`(?:daily|per\s+day)\s+(?:income|earning|payment|salary)`,
  String.raw`(?:complet(?:e|ing)|finish(?:ing)?|do(?:ing)?)\s+(?:simple|daily|small|easy|online|assigned)\s+tasks?`,
  String.raw`task\s+(?:completion|based|bonus|commission|job|group|reward)`,
  String.raw`(?:like|rate|review|subscribe\s+to|follow|watch)\s+(?:and\s+(?:earn|get)\s+)?(?:youtube|videos?|products?|hotels?|apps?|reels?|posts?)[^.!?\n]{0,15}?(?:earn|get|receive|rs|₹)`,
  String.raw`no\s+(?:experience|investment|qualification)\s+(?:needed|required|necessary)`,
  String.raw`hiring\s+(?:for\s+)?(?:part|work|online|freshers?)`,
  String.raw`(?:telegram|whatsapp)\s+(?:task|job)s?|commission\s+(?:on|for)\s+(?:each|every)`,
  // Hindi
  String.raw`घर\s+बैठे\s+(?:कमाएं|कमाओ|कमाई|पैसे\s+कमाएं|काम)|आसान\s+(?:काम|कमाई|टास्क)|पार्ट\s*टाइम\s+(?:जॉब|काम|नौकरी)|वर्क\s+फ्रॉम\s+होम|ऑनलाइन\s+(?:कमाई|जॉब|काम)|टास्क\s+(?:पूरा|कम्पलीट|पूरे)\s+(?:करें|करो)`,
  String.raw`(?:रोज़|रोजाना|प्रतिदिन|रोज)\s+(?:₹|रु\.?|रुपये)?\s*[0-9][0-9,]*\s*(?:रुपये|रु)?\s*(?:कमाएं|कमाओ|कमाई)`,
  // Hinglish
  String.raw`ghar\s+baithe\s+(?:kamao|kamaye|kamayein|paise|earn)|part\s*time\s+job|aasan\s+(?:kaam|task)|task\s+complete\s+(?:karo|karein|kare)`,
];

export const INVESTMENT_PATTERNS = [
  String.raw`(?:guaranteed|assured|fixed|sure|100%|risk[-\s]free|zero[-\s]risk)\s+(?:returns?|profits?|income|gains?|earnings?|payout)`,
  String.raw`(?:returns?|profits?)\s+(?:are\s+|is\s+)?(?:guaranteed|assured)`,
  String.raw`double\s+(?:your|the)\s+(?:money|investment|amount)|(?:money|investment)\s+(?:will\s+)?doubles?`,
  String.raw`registered\s+for\s+our\s+investment\s+(?:program|programme|plan)`,
  String.raw`account\s+manager[^.!?\n]{0,40}?call`,
  String.raw`(?:earned|earn|earning)\s+(?:rs\.?\s*|₹\s*|inr\s*)[0-9][0-9,]*\s+(?:daily|a\s+day|per\s+day)`,
  String.raw`insider\s+(?:tips?|information|info|trading|news)|sure[-\s]?shot`,
  String.raw`(?:vip|premium|exclusive)\s+(?:stock|trading|investment|crypto|forex)\s+(?:group|tips|signals?|channel|club)`,
  String.raw`(?:stock|share|trading|crypto|forex|ipo)\s+(?:tips?|signals?|calls?)\s+(?:group|channel|on|via)`,
  String.raw`[0-9]{1,3}\s*%\s*(?:returns?|profit|interest|gain)\s+(?:per|a|every|daily|weekly|monthly|in|within)`,
  String.raw`(?:earn|get|make)\s+(?:[0-9]+\s*x|[0-9]{2,4}\s*%)\s+(?:returns?|profit)`,
  String.raw`(?:crypto|bitcoin|forex)\s+(?:investment|trading)\s+(?:opportunity|platform|scheme|plan)`,
  // Hindi
  String.raw`गारंटीड\s+(?:रिटर्न|मुनाफा|कमाई)|पक्का\s+मुनाफा|पैसे\s+(?:दोगुने|डबल)|दोगुना\s+(?:पैसा|मुनाफा|रिटर्न)|इनसाइडर\s+(?:टिप|जानकारी)|शेयर\s+(?:बाजार\s+)?टिप्स|निश्चित\s+(?:रिटर्न|मुनाफा)|जोखिम\s+(?:रहित|मुक्त)\s+(?:निवेश|मुनाफा)`,
  // Hinglish
  String.raw`guaranteed\s+return|pakka\s+munafa|paisa\s+double|paise\s+double|double\s+paisa|share\s+market\s+tips|fixed\s+return|daily\s+profit`,
];

export const LOAN_PATTERNS = [
  String.raw`(?:pre[-\s]?approved|instant|quick|easy|urgent|sanctioned)\s+(?:personal\s+|business\s+|cash\s+)?loan`,
  String.raw`loan\s+(?:is\s+)?(?:approved|sanctioned|offer|disbursal|ready)`,
  String.raw`loan\s+without\s+(?:any\s+)?(?:documents?|cibil|collateral|income\s+proof)`,
  String.raw`(?:credit|cibil)\s+(?:limit|score)\s+(?:increase|upgrade|improve)|no\s+cibil`,
  String.raw`लोन\s+(?:पास|मंजूर|स्वीकृत|अप्रूव)|बिना\s+(?:दस्तावेज|सिबिल|गारंटी)\s+(?:के\s+)?लोन|इंस्टेंट\s+लोन|प्री[-\s]?अप्रूव्ड\s+लोन`,
  String.raw`loan\s+(?:approve|pass|sanction)\s+ho\s+gaya|bina\s+(?:documents?|cibil)\s+(?:ke\s+)?loan`,
];

// ----------------------------------------------------------- family emergency

export const RELATIVE_WORDS = String.raw`mom|mum|mummy|maa|mama|mami|dad|papa|pappa|bhai|bhaiya|bro|didi|sis|beta|bete|uncle|aunty|aunt|chacha|dadi|nani|मम्मी|माँ|मां|पापा|भैया|भाई|दीदी|बेटा|चाचा|मामा`;
export const NEW_NUMBER_PATTERNS = [
  String.raw`(?:this\s+is|it${APOS}s|its|it\s+is)\s+my\s+new\s+(?:number|no\.?|phone|mobile)`,
  String.raw`(?:i\s+)?(?:changed|lost|dropped|broke)\s+(?:my\s+)?(?:phone|number|sim|mobile)`,
  String.raw`save\s+this\s+(?:new\s+)?(?:number|no\.?)`,
  String.raw`my\s+(?:old\s+)?(?:phone|number|mobile)\s+(?:is\s+)?(?:not\s+working|broken|lost|damaged|stolen)`,
  String.raw`new\s+number`,
  // Hindi / Hinglish
  String.raw`नया\s+(?:नंबर|नम्बर|फोन|मोबाइल)|फोन\s+(?:खराब|खो\s+गया|टूट\s+गया)`,
  String.raw`naya\s+(?:number|no|phone|mobile)|phone\s+(?:kharab|kho\s+gaya|toot\s+gaya)`,
];
export const EMERGENCY_PATTERNS = [
  String.raw`(?:i\s+am|i${APOS}m|im)\s+in\s+(?:trouble|hospital|a\s+hospital|an\s+accident|an\s+emergency|police\s+station|jail|danger)`,
  String.raw`(?:urgently|immediately|right\s+now)\s+(?:need|require|send)\s+(?:money|rs\.?|₹|cash|help|some\s+money)`,
  String.raw`(?:need|require)\s+(?:money|cash|rs\.?\s*[0-9]|₹)\s*[^.!?\n]{0,10}?(?:urgently|immediately|right\s+now|asap)`,
  String.raw`(?:accident|hospital|bail|kidnap(?:ped)?|stranded|stuck\s+(?:at|in))[^.!?\n]{0,30}?(?:money|send|transfer|pay|rs\.?|₹)`,
  String.raw`मुसीबत\s+में|अस्पताल\s+में|एक्सीडेंट|हादसा`,
  String.raw`musibat\s+mein|hospital\s+mein|accident\s+ho\s+gaya`,
];

// --------------------------------------------------------------- sextortion

export const SEXTORTION_PATTERNS = [
  String.raw`(?:i|we)\s+(?:have|got|recorded|hacked|captured)\s+[^.!?\n]{0,40}?(?:video|videos|photos?|pictures?|recording|screenshots?)`,
  String.raw`(?:leak|share|send|post|upload|publish|forward)\s+[^.!?\n]{0,50}?(?:video|videos|photos?|pictures?|recordings?|screenshots?)\s+[^.!?\n]{0,40}?(?:family|friends|contacts|relatives|social\s+media|facebook|instagram|whatsapp|youtube|everyone|public)`,
  String.raw`(?:nude|naked|obscene|intimate|private)\s+(?:video|videos|photos?|pictures?|call|clips?)`,
  String.raw`make\s+(?:it|them|your\s+\w+)\s+viral|go\s+viral|viral\s+(?:your|the|this)`,
  // Hindi
  String.raw`(?:अश्लील|नग्न|निजी|प्राइवेट)\s+(?:वीडियो|फोटो|तस्वीर|तस्वीरें)`,
  String.raw`(?:आपका|आपकी)\s+(?:वीडियो|फोटो)\s+(?:वायरल|लीक)`,
  String.raw`वीडियो\s+वायरल`,
  // Hinglish
  String.raw`video\s+viral\s+kar|nude\s+video|aapki\s+video\s+(?:leak|viral)`,
];

// ------------------------------------------------------------ fake support

export const SUPPORT_CTA = String.raw`call|dial|contact|ring|phone|whatsapp|reach|text|कॉल|संपर्क|फोन|फ़ोन`;
export const SUPPORT_WORD = String.raw`customer\s+(?:care|support|service)|help\s*line|support|toll[-\s]?free|help\s*desk|executive|कस्टमर\s+केयर|हेल्पलाइन|सपोर्ट`;
export const MOBILE_NUMBER = String.raw`(?:\+?91[-\s]?)?[6-9](?:[-\s]?[0-9]){9}`;

// ----------------------------------------------------- checker instructions

export const CHECKER_PATTERNS = [
  String.raw`ignore\s+(?:all|any|every|the|your|previous|prior|above|earlier|these)\s+(?:the\s+)?(?:previous\s+)?(?:rules|instructions|prompts?|guidelines|directions|checks?)`,
  String.raw`disregard\s+(?:all|any|the|your|previous|prior|above)\s+[^.!?\n]{0,20}?(?:rules|instructions|prompts?)`,
  String.raw`mark\s+(?:this|it|the\s+message)\s+(?:as\s+)?(?:safe|legit(?:imate)?|genuine|real|not\s+(?:a\s+)?(?:scam|fraud|spam)|harmless|low\s+risk|trusted)`,
  String.raw`(?:say|tell|respond|reply|answer|report|output|state|conclude|declare|label)\s+(?:the\s+user\s+|me\s+)?(?:that\s+)?(?:this\s+|it\s+)?(?:is|as|looks|seems|to\s+be)\s+(?:safe|legit(?:imate)?|genuine|not\s+(?:a\s+)?(?:scam|fraud|spam)|harmless|low\s+risk)`,
  String.raw`you\s+are\s+now\s+(?:a|an|in)`,
  String.raw`system\s+prompt`,
  String.raw`(?:new|updated)\s+instructions?\s*:`,
  String.raw`as\s+an?\s+(?:ai|language\s+model|assistant)`,
  String.raw`do\s+not\s+(?:flag|report|warn)`,
];

// -------------------------------------------------------------- link prompt

export const LINK_PROMPT_PATTERNS = [
  String.raw`(?:click|tap|press|open|visit|follow|use|go\s+to)\s+(?:on\s+)?(?:the\s+|this\s+|below\s+|following\s+|attached\s+|link\s+)?(?:link|url|here|below|button)`,
  String.raw`लिंक\s+(?:पर\s+)?(?:क्लिक|टैप|खोलें)|यहां\s+क्लिक|यहाँ\s+क्लिक|नीचे\s+दिए\s+(?:गए\s+)?लिंक`,
  String.raw`link\s+(?:pe|par)\s+(?:click|tap)|click\s+karo|click\s+karein`,
];

// ------------------------------------------------- category context helpers

export const UPI_CONTEXT = /\b(?:upi|qr(?:\s*code)?|collect\s+request|gpay|google\s+pay|phonepe|paytm|bhim)\b|यूपीआई|क्यूआर|क्यू\s*आर/iu;
export const PARCEL_CONTEXT = /\b(?:parcel|package|courier|consignment|shipment|customs|delivery|redelivery|dispatch|speed\s+post|awb)\b|पार्सल|कूरियर|डिलीवरी|कस्टम/iu;
