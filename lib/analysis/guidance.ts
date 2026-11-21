/**
 * Plain-language next steps (spec F04 table and F05).
 *
 * HINDI REVIEW NOTE: all Hindi strings here were written by the engine author and must be
 * reviewed by a fluent Hindi speaker before the demo. Reporting guidance (1930, Chakshu on
 * Sanchar Saathi, cybercrime.gov.in) should be checked against the official portals at release.
 *
 * Rules: never tell the user to click or open a link, never use the word "safe" as a verdict,
 * never promise an outcome or invent legal facts.
 */
import type { Bilingual, RiskLevel, ScamCategory } from "@/lib/types";

const MAX_ACTIONS = 6;

const NEVER_SHARE: Bilingual = {
  en: "Do not share OTPs, UPI PINs, passwords or card details with anyone, even if they sound official.",
  hi: "ओटीपी, यूपीआई पिन, पासवर्ड या कार्ड की जानकारी किसी को न बताएं, चाहे वह कितना भी सरकारी या बैंक वाला लगे।",
};

const DO_NOT_ENGAGE: Bilingual = {
  en: "Ignore any link or phone number in this message, and do not reply to it.",
  hi: "इस संदेश में दिए किसी भी लिंक या फोन नंबर को अनदेखा करें, और संदेश का जवाब न दें।",
};

const LOST_MONEY: Bilingual = {
  en: "If you already shared details or paid money, call your bank right away and call 1930, or report at cybercrime.gov.in.",
  hi: "अगर आपने जानकारी दे दी है या पैसे भेज दिए हैं, तो तुरंत अपने बैंक को फोन करें और 1930 पर कॉल करें, या cybercrime.gov.in पर शिकायत करें।",
};

const REPORT_COMMUNICATION: Bilingual = {
  en: "To report a suspected fraud call or message, use the Chakshu facility on the Sanchar Saathi website.",
  hi: "संदिग्ध ठगी वाले कॉल या संदेश की शिकायत के लिए संचार साथी वेबसाइट पर चक्षु सुविधा का इस्तेमाल करें।",
};

const VERIFY_OFFICIAL: Bilingual = {
  en: "If you are unsure, contact the organization using a number from its official app or website, not from this message.",
  hi: "अगर आपको शक है, तो संस्था से उसके आधिकारिक ऐप या वेबसाइट पर दिए नंबर से संपर्क करें, इस संदेश में दिए नंबर से नहीं।",
};

const BY_CATEGORY: Record<ScamCategory, Bilingual> = {
  banking_kyc: {
    en: "Do not use the link. Check your account in your bank's official app or website, or call the number printed on your card or passbook.",
    hi: "लिंक का इस्तेमाल न करें। अपना खाता बैंक के आधिकारिक ऐप या वेबसाइट पर देखें, या अपने कार्ड या पासबुक पर छपे नंबर पर फोन करें।",
  },
  upi_payment: {
    en: "Entering a UPI PIN sends money out. You never need it to receive money. Do not scan or approve a request you did not expect.",
    hi: "यूपीआई पिन डालने से पैसे आपके खाते से जाते हैं। पैसे पाने के लिए इसकी कभी ज़रूरत नहीं होती। जिस रिक्वेस्ट की उम्मीद नहीं थी, उसे स्कैन या मंज़ूर न करें।",
  },
  government_impersonation: {
    en: "Do not pay or follow instructions from someone who claims to be police or a government officer. Contact the department yourself through its official website or a number you find on your own.",
    hi: "जो खुद को पुलिस या सरकारी अधिकारी बताए, उसे पैसे न दें और उसके निर्देश न मानें। विभाग से उसकी आधिकारिक वेबसाइट या खुद ढूंढे गए नंबर पर संपर्क करें।",
  },
  delivery_customs: {
    en: "Check the parcel on the courier's official website or app. Do not pay a \"fee\" through a link in a message.",
    hi: "पार्सल की स्थिति कूरियर की आधिकारिक वेबसाइट या ऐप पर देखें। संदेश में आए लिंक से कोई \"शुल्क\" न भरें।",
  },
  utility_disconnection: {
    en: "Check your bill in the provider's official app or website, or at its office. Do not pay through a link or number sent in a message.",
    hi: "अपना बिल कंपनी के आधिकारिक ऐप, वेबसाइट या दफ्तर में देखें। संदेश में आए लिंक या नंबर से भुगतान न करें।",
  },
  job_task: {
    en: "Do not pay money to get a job or to do tasks. Check the employer yourself on its official website.",
    hi: "नौकरी पाने या टास्क करने के लिए पैसे न दें। नियोक्ता की जानकारी उसकी आधिकारिक वेबसाइट पर खुद जांचें।",
  },
  investment: {
    en: "Be careful with promises of guaranteed returns. Before investing, check on your own that the firm and the adviser are registered with the proper regulator.",
    hi: "पक्के मुनाफे के वादों से सावधान रहें। निवेश से पहले खुद जांचें कि कंपनी और सलाहकार संबंधित नियामक के पास पंजीकृत हैं।",
  },
  loan_credit: {
    en: "Do not pay a fee before a loan is given. Use only lenders whose official app or website you found yourself.",
    hi: "लोन मिलने से पहले कोई शुल्क न दें। केवल उन्हीं कर्जदाताओं का इस्तेमाल करें जिनका आधिकारिक ऐप या वेबसाइट आपने खुद ढूंढी हो।",
  },
  fake_support: {
    en: "Do not call the number in the message. Find the support number on the company's official website or app.",
    hi: "संदेश में दिए नंबर पर फोन न करें। सपोर्ट का नंबर कंपनी की आधिकारिक वेबसाइट या ऐप पर देखें।",
  },
  remote_access_apk: {
    en: "Do not install apps from links or files sent to you, and do not share your screen or allow remote access. Install apps only from the official Play Store or App Store.",
    hi: "भेजे गए लिंक या फाइल से कोई ऐप इंस्टॉल न करें, और अपनी स्क्रीन साझा न करें या रिमोट एक्सेस न दें। ऐप केवल आधिकारिक प्ले स्टोर या ऐप स्टोर से इंस्टॉल करें।",
  },
  family_emergency: {
    en: "Before sending money, call the person on the number you already have, or ask another family member. Ask a question only the real person could answer.",
    hi: "पैसे भेजने से पहले उस व्यक्ति को उसके पुराने नंबर पर फोन करें, या परिवार के किसी और सदस्य से पूछें। ऐसा सवाल पूछें जिसका जवाब सिर्फ असली व्यक्ति दे सके।",
  },
  sextortion: {
    en: "Do not pay or reply. Keep screenshots as evidence, block the sender and report it. Being blackmailed is not your fault.",
    hi: "पैसे न दें और जवाब न दें। सबूत के लिए स्क्रीनशॉट रखें, भेजने वाले को ब्लॉक करें और शिकायत करें। ब्लैकमेल होना आपकी गलती नहीं है।",
  },
  gambling_spam: {
    en: "Ignore betting and casino offers. Do not tap the link or deposit money: unknown betting sites can keep your money and your details.",
    hi: "सट्टेबाज़ी और कैसीनो के ऑफ़र को नज़रअंदाज़ करें। लिंक न खोलें और पैसे जमा न करें: अनजान सट्टा साइटें आपके पैसे और जानकारी रख सकती हैं।",
  },
  prize_lottery: {
    en: "You cannot win a prize you did not enter. Do not pay any fee or share any detail to claim it.",
    hi: "जिस इनाम के लिए आपने हिस्सा ही नहीं लिया, वह आप जीत नहीं सकते। उसे पाने के लिए कोई शुल्क न दें और कोई जानकारी न दें।",
  },
  credential_theft: {
    en: "A real organization will not ask you to type or tell your secret details in reply to a message or call.",
    hi: "कोई असली संस्था संदेश या कॉल के जवाब में आपसे गोपनीय जानकारी लिखने या बताने को नहीं कहती।",
  },
  malicious_file: {
    en: "Do not install or open this file. Install apps only from the official Play Store or App Store.",
    hi: "इस फाइल को इंस्टॉल या ओपन न करें। ऐप केवल आधिकारिक प्ले स्टोर या ऐप स्टोर से इंस्टॉल करें।",
  },
  other: VERIFY_OFFICIAL,
};

function dedupe(items: Bilingual[]): Bilingual[] {
  const seen = new Set<string>();
  const out: Bilingual[] = [];
  for (const i of items) {
    if (seen.has(i.en)) continue;
    seen.add(i.en);
    out.push({ ...i });
  }
  return out;
}

/**
 * Plain-language next steps for the detected categories and risk level (max 6, no duplicates).
 * Always includes the "do not share OTP/PIN/password/card details" line.
 */
export function actionsFor(categories: ScamCategory[], level: RiskLevel): Bilingual[] {
  const specific = categories.filter((c) => c !== "other").map((c) => BY_CATEGORY[c]).filter(Boolean);
  let list: Bilingual[];

  if (level === "high" || level === "suspicious") {
    const top = specific.slice(0, 3);
    list = [
      ...(top.length > 0 ? [top[0]] : [VERIFY_OFFICIAL]),
      NEVER_SHARE,
      ...top.slice(1),
      DO_NOT_ENGAGE,
      LOST_MONEY,
      ...(level === "high" ? [REPORT_COMMUNICATION] : []),
    ];
    if (top.length === 0) list.push(REPORT_COMMUNICATION);
  } else {
    list = [
      VERIFY_OFFICIAL,
      NEVER_SHARE,
      ...specific.slice(0, 2),
      {
        en: "Be careful with links you were not expecting. Type the organization's official address yourself instead.",
        hi: "जिन लिंक की आपको उम्मीद नहीं थी, उनसे सावधान रहें। उसकी जगह संस्था का आधिकारिक पता खुद टाइप करें।",
      },
      LOST_MONEY,
    ];
  }

  const out = dedupe(list).slice(0, MAX_ACTIONS);
  // Make sure the never-share line survived the cut.
  if (!out.some((a) => a.en === NEVER_SHARE.en)) out.splice(Math.min(1, out.length), 0, { ...NEVER_SHARE });
  return out.slice(0, MAX_ACTIONS);
}

/** Standard limitations shown with every result. */
export function baseLimitations(): Bilingual[] {
  return [
    {
      en: "This result is not a guarantee of safety. Scammers change their wording, and a message with no warning signs can still be a scam.",
      hi: "यह नतीजा सुरक्षा की गारंटी नहीं है। ठग अपने शब्द बदलते रहते हैं, और जिस संदेश में कोई चेतावनी न दिखे वह भी ठगी हो सकता है।",
    },
    {
      en: "The sender has not been verified. Only the organization itself can confirm that a message is from it.",
      hi: "भेजने वाले की पहचान की जांच नहीं हुई है। कोई संदेश संस्था ने ही भेजा है, यह केवल वही संस्था बता सकती है।",
    },
    {
      en: "New scams may not be recognized. This check looks at the text you gave it and cannot see anything else about the sender.",
      hi: "नई तरह की ठगी पहचानी न जा सके, ऐसा हो सकता है। यह जांच सिर्फ आपके दिए पाठ को देखती है और भेजने वाले के बारे में और कुछ नहीं देख सकती।",
    },
  ];
}
