/**
 * Mock AnalysisResult fixtures for /dev/preview. They are hand-written examples
 * for looking at the interface, not output from the real engine.
 */
import type { AnalysisResult } from "@/lib/types";

const CREATED = "2026-01-15T10:30:00.000Z";

export const mockScamMessage: AnalysisResult = {
  id: "mock-scam-message",
  kind: "message",
  createdAt: CREATED,
  riskLevel: "high",
  uiState: "potential_scam",
  score: 88,
  categories: ["banking_kyc", "credential_theft"],
  summary: {
    en: "This message threatens to block your bank account and sends you to an unverified link to finish KYC. This is a common phishing trick.",
    hi: "यह संदेश आपका बैंक खाता बंद करने की धमकी देता है और KYC पूरा करने के लिए एक अनजान लिंक पर भेजता है। यह फ़िशिंग की आम चाल है।",
  },
  requestedAction: {
    en: "Open a link and enter your bank details to complete KYC.",
    hi: "एक लिंक खोलें और KYC पूरा करने के लिए अपनी बैंक जानकारी दर्ज करें।",
  },
  indicators: [
    {
      id: "threat",
      type: "threat",
      source: "rule",
      evidence: "Your bank account will be blocked today",
      explanation: {
        en: "It threatens to block your account to scare you into acting fast.",
        hi: "यह आपको जल्दबाज़ी में कदम उठाने के लिए डराने को खाता बंद करने की धमकी देता है।",
      },
      points: 25,
    },
    {
      id: "credential_request",
      type: "credential_request",
      source: "rule",
      evidence: "Complete KYC immediately",
      explanation: {
        en: "Banks do not ask you to complete KYC through a link sent in a message.",
        hi: "बैंक संदेश में भेजे गए लिंक से KYC पूरा करने को नहीं कहते।",
      },
      points: 25,
    },
    {
      id: "impersonation",
      type: "impersonation",
      source: "ai",
      inferred: true,
      explanation: {
        en: "The wording copies how a real bank might write, but nothing shows it comes from the bank.",
        hi: "शब्द ऐसे हैं जैसे असली बैंक लिखता है, लेकिन ऐसा कुछ नहीं दिखता कि यह बैंक से आया है।",
      },
      points: 15,
    },
    {
      id: "link_risk",
      type: "link_risk",
      source: "url_provider",
      evidence: "https://sbi-verify-account.example",
      explanation: {
        en: "The link address uses a bank's name but is not the bank's own website.",
        hi: "लिंक के पते में बैंक का नाम है, लेकिन यह बैंक की अपनी वेबसाइट नहीं है।",
      },
      points: 20,
    },
  ],
  urlChecks: [
    {
      url: "https://sbi-verify-account.example/",
      hostname: "sbi-verify-account.example",
      flags: [
        {
          id: "brand_lookalike",
          explanation: {
            en: "The address includes a well-known bank name but is not the bank's own domain.",
            hi: "पते में एक जाने-माने बैंक का नाम है, लेकिन यह बैंक का अपना डोमेन नहीं है।",
          },
          points: 20,
        },
        {
          id: "suspicious_tld",
          explanation: {
            en: "The ending of the address is one that is often used in scams.",
            hi: "पते का अंत ऐसा है जो अक्सर ठगी में इस्तेमाल होता है।",
          },
          points: 5,
        },
      ],
      reputation: [
        {
          provider: "VirusTotal",
          status: "malicious",
          threatTypes: ["phishing"],
          checkedAt: CREATED,
          referenceUrl: "https://www.virustotal.com/",
          detail: "Flagged by 4 engines",
        },
      ],
    },
  ],
  recommendedActions: [
    { en: "Do not open the link.", hi: "लिंक न खोलें।" },
    {
      en: "Do not share OTPs, passwords or account details.",
      hi: "OTP, पासवर्ड या खाते की जानकारी किसी को न बताएं।",
    },
    {
      en: "Check your account in your bank's official app, or call the number printed on your card.",
      hi: "अपने बैंक के आधिकारिक ऐप में खाता देखें, या अपने कार्ड पर छपे नंबर पर कॉल करें।",
    },
    { en: "Delete the message and block the sender.", hi: "संदेश डिलीट करें और भेजने वाले को ब्लॉक करें।" },
  ],
  limitations: [
    {
      en: "ASTRA only sees the text you pasted. It cannot confirm who really sent the message.",
      hi: "ASTRA सिर्फ़ वही टेक्स्ट देखता है जो आपने पेस्ट किया। वह यह पक्का नहीं कर सकता कि संदेश असल में किसने भेजा।",
    },
  ],
  evidenceConfidence: "high",
  checks: [
    { id: "rules", status: "ran" },
    { id: "ai", status: "ran" },
    { id: "url_reputation", status: "ran" },
    { id: "file_reputation", status: "not_applicable" },
  ],
  aiUsed: true,
};

export const mockSuspicious: AnalysisResult = {
  id: "mock-suspicious",
  kind: "message",
  createdAt: CREATED,
  riskLevel: "suspicious",
  uiState: "suspicious",
  score: 52,
  categories: ["delivery_customs"],
  summary: {
    en: "This message says a parcel is held and asks for a small fee. Real couriers usually do not ask for fees through a message link.",
    hi: "यह संदेश कहता है कि पार्सल रुका है और थोड़ी फ़ीस मांगता है। असली कूरियर कंपनियां आमतौर पर संदेश के लिंक से फ़ीस नहीं मांगतीं।",
  },
  indicators: [
    {
      id: "payment_request",
      type: "payment_request",
      source: "rule",
      evidence: "pay a customs fee of Rs 49",
      explanation: {
        en: "It asks for a small payment to release a parcel. This is a common way to collect card or UPI details.",
        hi: "यह पार्सल छुड़ाने के लिए थोड़ा भुगतान मांगता है। कार्ड या UPI की जानकारी लेने का यह आम तरीका है।",
      },
      points: 20,
    },
    {
      id: "urgency",
      type: "urgency",
      source: "rule",
      evidence: "within 24 hours",
      explanation: {
        en: "It sets a short deadline so you act before thinking.",
        hi: "यह कम समय की सीमा रखता है ताकि आप सोचने से पहले कदम उठा लें।",
      },
      points: 10,
    },
  ],
  urlChecks: [],
  recommendedActions: [
    {
      en: "Check the parcel in the courier's or shop's own app or website.",
      hi: "पार्सल की स्थिति कूरियर या दुकान के अपने ऐप या वेबसाइट पर देखें।",
    },
    { en: "Do not pay through links sent in messages.", hi: "संदेश में आए लिंक से भुगतान न करें।" },
  ],
  limitations: [
    {
      en: "A real delivery can sometimes look like this. Check with the real courier to be sure.",
      hi: "असली डिलीवरी भी कभी-कभी ऐसी दिख सकती है। पक्का करने के लिए असली कूरियर से पूछें।",
    },
  ],
  evidenceConfidence: "medium",
  checks: [
    { id: "rules", status: "ran" },
    { id: "ai", status: "ran" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: "not_applicable" },
  ],
  aiUsed: true,
};

export const mockLikelySafe: AnalysisResult = {
  id: "mock-likely-safe",
  kind: "message",
  createdAt: CREATED,
  riskLevel: "no_clear_warning",
  uiState: "likely_safe",
  score: 4,
  categories: [],
  summary: {
    en: "This looks like an ordinary delivery update. It does not ask for money, codes or personal details.",
    hi: "यह सामान्य डिलीवरी अपडेट जैसा लगता है। इसमें पैसे, कोड या निजी जानकारी नहीं मांगी गई है।",
  },
  indicators: [],
  urlChecks: [],
  recommendedActions: [
    {
      en: "If you were not expecting this order, check the shop's own app or website.",
      hi: "अगर आप यह ऑर्डर नहीं उम्मीद कर रहे थे, तो दुकान के अपने ऐप या वेबसाइट पर देखें।",
    },
    { en: "Never share an OTP with anyone.", hi: "OTP किसी को न बताएं।" },
  ],
  limitations: [
    {
      en: "ASTRA cannot confirm who sent this message.",
      hi: "ASTRA यह पक्का नहीं कर सकता कि यह संदेश किसने भेजा।",
    },
  ],
  evidenceConfidence: "medium",
  checks: [
    { id: "rules", status: "ran" },
    { id: "ai", status: "ran" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: "not_applicable" },
  ],
  aiUsed: true,
};

export const mockUnableUrl: AnalysisResult = {
  id: "mock-unable-url",
  kind: "url",
  createdAt: CREATED,
  riskLevel: "unable",
  uiState: "unable",
  score: 10,
  categories: [],
  summary: {
    en: "We could not look this link up with an online safety service right now, so we cannot say much about it.",
    hi: "हम अभी इस लिंक को ऑनलाइन सुरक्षा सेवा से जांच नहीं सके, इसलिए इसके बारे में ज़्यादा नहीं कह सकते।",
  },
  indicators: [],
  urlChecks: [
    {
      url: "http://offers-today.example/win",
      hostname: "offers-today.example",
      flags: [
        {
          id: "http_only",
          explanation: {
            en: "The address does not use a secure connection (it starts with http, not https).",
            hi: "पता सुरक्षित कनेक्शन इस्तेमाल नहीं करता (यह https नहीं, http से शुरू होता है)।",
          },
          points: 5,
        },
      ],
      reputation: [
        {
          provider: "VirusTotal",
          status: "unavailable",
          threatTypes: [],
          checkedAt: CREATED,
        },
      ],
    },
  ],
  recommendedActions: [
    { en: "Do not open the link until you know who sent it.", hi: "जब तक पता न हो कि किसने भेजा, लिंक न खोलें।" },
    {
      en: "Try the check again in a few minutes.",
      hi: "कुछ मिनट बाद जांच फिर से करके देखें।",
    },
  ],
  limitations: [
    {
      en: "The link safety lookup did not run, so this result is not a sign that the link is fine.",
      hi: "लिंक की सुरक्षा जांच नहीं चली, इसलिए यह नतीजा इस बात का संकेत नहीं कि लिंक ठीक है।",
    },
  ],
  evidenceConfidence: "low",
  checks: [
    { id: "rules", status: "ran" },
    { id: "ai", status: "skipped" },
    {
      id: "url_reputation",
      status: "unavailable",
      note: {
        en: "The lookup service did not answer in time.",
        hi: "जांच सेवा ने समय पर जवाब नहीं दिया।",
      },
    },
    { id: "file_reputation", status: "not_applicable" },
  ],
  aiUsed: false,
};

export const mockApkNotFound: AnalysisResult = {
  id: "mock-apk-not-found",
  kind: "file",
  createdAt: CREATED,
  riskLevel: "unable",
  uiState: "unable",
  score: 30,
  categories: ["remote_access_apk"],
  summary: {
    en: "This file is not in VirusTotal's records. That is not a sign that it is safe.",
    hi: "यह फ़ाइल VirusTotal के रिकॉर्ड में नहीं है। इसका मतलब यह नहीं कि यह सुरक्षित है।",
  },
  indicators: [],
  urlChecks: [],
  fileCheck: {
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    reputation: {
      provider: "VirusTotal",
      status: "not_found",
      checkedAt: CREATED,
      referenceUrl: "https://www.virustotal.com/gui/file/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    },
  },
  recommendedActions: [
    {
      en: "Do not install an app file that came to you through chat or SMS.",
      hi: "चैट या SMS से मिली ऐप फ़ाइल इंस्टॉल न करें।",
    },
    { en: "Install apps only from the official Play Store.", hi: "ऐप सिर्फ़ आधिकारिक Play Store से इंस्टॉल करें।" },
  ],
  limitations: [
    {
      en: "A match only covers files VirusTotal has already seen. Scammers can change an app for each victim.",
      hi: "मिलान सिर्फ़ उन फ़ाइलों पर होता है जिन्हें VirusTotal पहले देख चुका है। ठग हर शिकार के लिए ऐप बदल सकते हैं।",
    },
    {
      en: "This check does not look at what the app would do on your phone.",
      hi: "यह जांच नहीं देखती कि ऐप आपके फ़ोन पर क्या करेगा।",
    },
  ],
  evidenceConfidence: "low",
  checks: [
    { id: "rules", status: "not_applicable" },
    { id: "ai", status: "not_applicable" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: "ran" },
  ],
  aiUsed: false,
};

export const mockApkMalicious: AnalysisResult = {
  id: "mock-apk-malicious",
  kind: "file",
  createdAt: CREATED,
  riskLevel: "high",
  uiState: "potential_scam",
  score: 95,
  categories: ["malicious_file", "remote_access_apk"],
  summary: {
    en: "Many security engines flag this file as dangerous. Do not install it.",
    hi: "कई सुरक्षा इंजन इस फ़ाइल को खतरनाक बताते हैं। इसे इंस्टॉल न करें।",
  },
  indicators: [
    {
      id: "file_reputation",
      type: "file_reputation",
      source: "file_provider",
      explanation: {
        en: "27 security engines flagged this file as dangerous.",
        hi: "27 सुरक्षा इंजनों ने इस फ़ाइल को खतरनाक के रूप में चिह्नित किया।",
      },
      points: 60,
    },
  ],
  urlChecks: [],
  fileCheck: {
    sha256: "3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b",
    reputation: {
      provider: "VirusTotal",
      status: "malicious",
      engineCounts: { malicious: 27, suspicious: 2, harmless: 0, undetected: 41 },
      topThreatNames: ["trojan.android/banker", "android.spy.agent"],
      firstSeen: "2025-11-02T08:00:00.000Z",
      lastAnalyzed: "2026-01-14T19:20:00.000Z",
      checkedAt: CREATED,
      referenceUrl: "https://www.virustotal.com/gui/file/3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b",
    },
  },
  recommendedActions: [
    { en: "Do not install this file. If you already did, uninstall it.", hi: "इस फ़ाइल को इंस्टॉल न करें। अगर कर चुके हैं, तो इसे अनइंस्टॉल करें।" },
    { en: "Contact your bank if you entered any banking details.", hi: "अगर आपने बैंक की जानकारी डाली है, तो अपने बैंक से संपर्क करें।" },
  ],
  limitations: [
    {
      en: "This check does not look at what the app would do on your phone.",
      hi: "यह जांच नहीं देखती कि ऐप आपके फ़ोन पर क्या करेगा।",
    },
  ],
  evidenceConfidence: "high",
  checks: [
    { id: "rules", status: "not_applicable" },
    { id: "ai", status: "not_applicable" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: "ran" },
  ],
  aiUsed: false,
};

export const mockPhoneUnable: AnalysisResult = {
  id: "mock-phone-unable",
  kind: "phone",
  createdAt: CREATED,
  riskLevel: "unable",
  uiState: "unable",
  score: 0,
  categories: [],
  summary: {
    en: "A phone number on its own cannot tell us whether someone is a scammer. Here is what to keep in mind.",
    hi: "सिर्फ़ फ़ोन नंबर से यह नहीं पता चल सकता कि कोई ठग है या नहीं। ये बातें ध्यान में रखें।",
  },
  indicators: [],
  urlChecks: [],
  phone: {
    kind: "indian_mobile",
    masked: "+91 ••••• ••210",
    description: {
      en: "This looks like an Indian mobile number.",
      hi: "यह भारतीय मोबाइल नंबर जैसा लगता है।",
    },
    country: "IN",
    countryName: { en: "India", hi: "भारत" },
    lineType: "mobile",
    numberPlanMatch: true,
  },
  recommendedActions: [
    {
      en: "If the caller said they are from a bank, police or a government office, end the call and contact them using a number from their official app or website.",
      hi: "अगर कॉल करने वाले ने खुद को बैंक, पुलिस या सरकारी दफ़्तर से बताया, तो कॉल काट दें और उनके आधिकारिक ऐप या वेबसाइट के नंबर पर संपर्क करें।",
    },
    { en: "Never share an OTP, PIN or card details on a call.", hi: "कॉल पर OTP, PIN या कार्ड की जानकारी कभी न बताएं।" },
    { en: "Never move money to “verify” an account.", hi: "खाते को “सत्यापित” करने के लिए कभी पैसे ट्रांसफ़र न करें।" },
  ],
  limitations: [
    {
      en: "ASTRA has no reliable list of good or bad phone numbers, so it cannot give a verdict on this number.",
      hi: "ASTRA के पास अच्छे या बुरे फ़ोन नंबरों की कोई भरोसेमंद सूची नहीं है, इसलिए वह इस नंबर पर फ़ैसला नहीं दे सकता।",
    },
  ],
  evidenceConfidence: "low",
  checks: [
    { id: "rules", status: "skipped" },
    { id: "ai", status: "skipped" },
    { id: "url_reputation", status: "not_applicable" },
    { id: "file_reputation", status: "not_applicable" },
  ],
  aiUsed: false,
};

export const MOCK_RESULTS = [
  { id: "potential_scam", label: "Potential Scam: message with evidence and a link check", result: mockScamMessage },
  { id: "suspicious", label: "Suspicious: message", result: mockSuspicious },
  { id: "likely_safe", label: "Likely Safe: message", result: mockLikelySafe },
  { id: "unable_url", label: "Could not fully check: link with a failed provider check", result: mockUnableUrl },
  { id: "apk_not_found", label: "File: not found", result: mockApkNotFound },
  { id: "apk_malicious", label: "File: flagged by many engines", result: mockApkMalicious },
  { id: "phone_unable", label: "Phone number: guidance only", result: mockPhoneUnable },
] as const;
