/**
 * ASTRA UI dictionary (English + Hindi).
 *
 * Every visible string in the interface comes from here. `hi` is typed as
 * Record<UiKey, string>, so a missing Hindi key fails `tsc`.
 *
 * Placeholders look like {n}; fill them with translate(lang, key, { n: 3 }).
 * Long copy uses "\n\n" for paragraph breaks and "\n" for list items (see
 * paragraphs() and lines() below).
 */
import type { Bilingual, Lang } from "@/lib/types";

// ===================================================================== ENGLISH
const en = {
  // ---- brand / chrome
  "brand.name": "ASTRA",
  "brand.devanagari": "अस्त्र",
  "brand.home": "ASTRA home",
  "nav.main": "Main navigation",
  "nav.home": "Home",
  "nav.how": "How It Works",
  "nav.about": "About",
  "nav.history": "History",
  "nav.getStarted": "Get Started",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.skip": "Skip to main content",
  "lang.group": "Language",
  "lang.enLabel": "English",
  "lang.hiLabel": "Hindi (हिंदी)",
  "lang.enShort": "EN",
  "lang.hiShort": "हिंदी",
  "common.opensNewTab": "(opens in a new tab)",
  "common.loading": "Loading…",
  "common.back": "Back to home",
  "error.title":
    "Something went wrong",
  "error.body":
    "Sorry, this page ran into a problem. Nothing you typed was saved or sent anywhere. Please try again.",
  "error.retry":
    "Try again",

  // ---- footer
  "footer.about": "About ASTRA",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.contact": "Contact",
  "footer.disclaimer": "Disclaimer",
  "footer.pages": "About",
  "footer.resources": "Official cybercrime resources",
  "footer.ncrp": "National Cyber Crime Reporting Portal",
  "footer.helpline": "Cyber fraud helpline: 1930",
  "footer.chakshu": "Chakshu on Sanchar Saathi",
  "footer.proto":
    "ASTRA is a hackathon prototype. It is not an official service of any government body, bank or company.",

  // ---- "I already did it" help (shown under warnings)
  "acted.title": "Already clicked a link or shared an OTP?",
  "acted.intro": "Do not panic. Acting quickly helps. Open what happened to you:",
  "acted.clicked.title": "I clicked a link",
  "acted.clicked.steps":
    "Close the page. Do not type anything into it and do not tap anything else on it.\nIf you typed a password, PIN or card details, change that password right away from the official app or a different device, and call your bank.\nIf a file was downloaded, do not open it. Delete it. If an app was installed, uninstall it.\nWatch your bank and UPI messages over the next few days and report anything you did not do.",
  "acted.otp.title": "I shared an OTP, PIN or card details",
  "acted.otp.steps":
    "Call your bank now, using the number on your card or in the official bank app, never a number from the message. Ask them to block the card, UPI or net banking.\nChange your UPI PIN, net-banking password and card PIN.\nCheck your recent transactions. If any money moved, call 1930 and report it at cybercrime.gov.in as soon as possible.\nNever share another code, even if the caller says it is to cancel or reverse the first one.",
  "acted.app.title": "I installed an app or let someone see my screen",
  "acted.app.steps":
    "Turn off Wi-Fi and mobile data so the other person can no longer see or control your phone.\nUninstall the app. In Settings, also look for apps with Accessibility or Device admin access that you do not recognize, and remove them.\nFrom a different phone or computer, change your banking, email and UPI passwords, and call your bank.\nIf you are not sure the phone is clean, a factory reset is the safest choice. Back up photos and contacts first.",
  "acted.id.title": "I shared Aadhaar, PAN or photos of my ID",
  "acted.id.steps":
    "Do not share more documents or photos with this person.\nOn the official UIDAI website or the mAadhaar app you can lock your Aadhaar biometrics, so nobody can use your fingerprint or iris with it.\nOn the official Sanchar Saathi website you can see which mobile connections are in your name and report any you do not recognize.\nBe careful with loan or credit offers and messages that mention your details. Report anything that looks wrong at cybercrime.gov.in or on 1930.",
  "acted.money.title": "I already sent money",
  "acted.money.steps":
    "Tell your bank or payment app right away what happened and ask them to stop or flag the payment.\nCall 1930 and report it at cybercrime.gov.in as soon as possible. Keep screenshots, the phone number and the transaction details ready.\nDo not send any more money, even if someone offers to get it back for a fee.\nSee the Lost money? box below for the official contacts.",

  // ---- history (opt-in, on this device)
  "history.title": "Your recent checks",
  "history.intro":
    "Keep a short list of your recent checks on this device so you can look back at them. It is off unless you turn it on.",
  "history.optin": "Save my recent checks on this device",
  "history.optin.hint":
    "Only a short summary is saved: the type of check, the result, the date, and the website name, a masked phone number or the start of a file fingerprint. Messages and pictures are never saved. It stays in this browser and is never sent to ASTRA. Entries delete themselves after {days} days. Turning this off deletes everything saved.",
  "history.on": "On",
  "history.off": "Off",
  "history.list": "Saved checks",
  "history.empty.off": "History is off. Nothing is being saved.",
  "history.empty.on": "No checks saved yet. Your next check will appear here.",
  "history.clear": "Delete all",
  "history.remove": "Remove",
  "history.removeLabel": "Remove this check from history",
  "history.kind.message": "Message",
  "history.kind.url": "Link",
  "history.kind.phone": "Phone number",
  "history.kind.file": "File",

  // ---- dark-mode extension notice
  "darkNotice.body":
    "A dark-mode extension is changing this page's colors. Warning colors may look different from what ASTRA intended. For accurate results, turn the extension off for this site.",
  "darkNotice.dismiss": "Got it",

  // ---- home
  "home.hero.title": "Stay Safe from Online Scams.",
  "home.hero.desc":
    "Check suspicious messages, links and phone numbers before trusting them. ASTRA helps you identify potential online threats using AI.",
  "home.hero.cta": "Check for Scam",
  "home.hero.secondary": "Learn How It Works",
  "home.safetyNotice":
    "Do not share OTPs, passwords, UPI PINs, full card numbers or banking credentials. ASTRA does not need these details to analyze a message.",
  "home.check.title": "What would you like to check?",
  "home.card.message.title": "Suspicious Message",
  "home.card.message.desc": "Check suspicious SMS messages and text conversations.",
  "home.card.message.btn": "Check Message",
  "home.card.link.title": "Suspicious Website or Link",
  "home.card.link.desc": "Check whether a website or link might be dangerous.",
  "home.card.link.btn": "Check Link",
  "home.card.number.title": "Unknown Phone Number",
  "home.card.number.desc": "Check potentially fraudulent phone numbers.",
  "home.card.number.btn": "Check Number",
  "home.file.link": "Received a file (app, program, zip, PDF)? Check it",
  "home.samples.title": "Try a sample",
  "home.samples.intro":
    "Not sure where to start? Tap a sample to see how ASTRA explains a result. Samples are made-up messages.",
  "sample.kyc.label": "Fake bank KYC message",
  "sample.kyc.expect": "A scam-style message with a fake link",
  "sample.upi.label": "UPI refund trick",
  "sample.upi.expect": "A message asking for a UPI PIN to receive money",
  "sample.delivery.label": "Normal delivery notice",
  "sample.delivery.expect": "A message with no request for money or codes",
  "home.how.title": "How It Works",
  "home.how.more": "Read more about how ASTRA works",
  "home.how.1.title": "Submit",
  "home.how.1.body": "Enter a message, a link or a phone number you are unsure about.",
  "home.how.2.title": "Analyze",
  "home.how.2.body": "ASTRA checks available threat indicators using AI.",
  "home.how.3.title": "Understand",
  "home.how.3.body": "Receive a clear explanation and safety recommendations.",
  "home.tips.title": "Stay alert: five simple habits",
  "home.tips.1": "Never share an OTP with anyone, even if they say they are from your bank.",
  "home.tips.2": "Never reveal your banking PIN or UPI PIN. You do not need a PIN to receive money.",
  "home.tips.3": "Avoid payment links and QR codes from people you do not know.",
  "home.tips.4": "If a caller says they are from a bank or a government department, hang up and call the official number yourself.",
  "home.tips.5": "Report suspected cybercrime through the official channels.",
  "home.privacyNote":
    "ASTRA has no accounts and is built not to store what you check. OTPs and card numbers are hidden in your browser before a message is sent. An optional history is off by default and stays on your device.",

  // ---- checker common
  "check.result.heading": "Result",
  "check.loading": "Checking. This usually takes a few seconds.",
  "check.example": "Example",
  "check.clear": "Clear",
  "check.required": "required",
  "check.optional": "optional",
  "demo.outage": "Demo mode: pretend the online checks are down",
  "demo.outage.hint": "For demonstrations. When on, ASTRA acts as if its outside checking services cannot be reached, so you can see it keep working and say so honestly. Currently:",
  "demo.on": "On",
  "demo.off": "Off",
  "check.errorTitle": "We could not complete the check",

  // ---- message checker
  "msg.title": "Check a suspicious message",
  "msg.intro":
    "Paste the message you received. ASTRA looks for common scam warning signs and explains them in plain words.",
  "msg.label": "Message text",
  "msg.hint": "Copy the message from SMS, WhatsApp, email or social media, then paste it here.",
  "msg.placeholder": "Paste the message here",
  "msg.example": "Your bank account will be blocked today. Complete KYC immediately: https://sbi-verify-account.example",
  "msg.paste": "Paste copied message",
  "msg.paste.denied":
    "We could not read your clipboard. Please press and hold inside the box, then choose Paste.",
  "msg.paste.unsupported":
    "This browser does not allow one-tap paste. Please press and hold inside the box, then choose Paste.",
  "msg.paste.empty": "Nothing was found on your clipboard. Please copy the message first.",
  "msg.image": "Read text from a picture",
  "msg.image.privacy":
    "To read a picture, ASTRA sends it to an AI service, which copies out the text. The picture is not saved. Pictures can show names and phone numbers, so crop it first if you can.",
  "msg.image.reading": "Reading the picture… this can take a few seconds.",
  "msg.image.done":
    "We read this text from your picture. Please check that it matches the message and fix any mistakes. Then press “Check this message”.",
  "msg.image.noText":
    "We could not find any text in this picture. Please try a clearer screenshot, or type or paste the message.",
  "msg.image.badFile":
    "This file could not be opened as a picture. Please choose a screenshot or photo.",
  "msg.image.tooBig": "This picture is too large. Please choose a smaller picture or a screenshot.",
  "msg.image.failed": "We could not read this picture right now. Please type or paste the message instead.",
  "msg.image.inputLabel": "Choose a screenshot or photo of the message",
  "msg.counter": "{n} of {max} characters",
  "msg.err.short": "Please enter at least {min} characters so ASTRA has something to check.",
  "msg.err.long": "This message is too long. Please keep it under {max} characters.",
  "msg.submit": "Check this message",
  "msg.privacy":
    "To explain a message, ASTRA may send the text you submit to an AI service. Sensitive numbers are hidden first, and ASTRA does not keep your message.",
  "redact.one": "We hid 1 sensitive item (like an OTP or card number) before checking.",
  "redact.many": "We hid {n} sensitive items (like OTPs or card numbers) before checking.",
  "redact.willSend": "This is exactly the text that will be checked:",
  "redact.caveat":
    "Hiding is automatic and can miss things. Please remove anything private yourself before you check.",
  "links.title": "Links found in your message",
  "links.noOpen": "We will not open these links.",

  // ---- link checker
  "link.title": "Check a suspicious link or website",
  "link.intro":
    "Enter the link you were sent. ASTRA never opens it. It only looks at the web address itself and asks safety services what they already know.",
  "link.label": "Link or website address",
  "link.hint": "Paste the full address. It usually starts with https://",
  "link.example": "https://sbi-verify-account.example",
  "link.never": "ASTRA never opens this link. Please do not open it either.",
  "link.privacy":
    "The web address you enter may be sent to a security service (VirusTotal) to see whether it is already known to be dangerous.",
  "link.err.empty": "Please enter a link or website address.",
  "link.err.long": "This address is too long. Please check that you copied only the link.",
  "link.submit": "Check this link",

  // ---- number checker
  "num.title": "Check an unknown phone number",
  "num.intro": "Enter the number that called or messaged you. ASTRA will explain what kind of number it is and what to do.",
  "num.honest":
    "A phone number on its own cannot tell us whether someone is a scammer. ASTRA does not keep a list of good or bad numbers, so it gives guidance, not a verdict about the number.",
  "num.label": "Phone number",
  "num.hint": "Enter the number exactly as it appeared.",
  "num.example": "98765 43210",
  "num.err.empty": "Please enter a phone number.",
  "num.channel.legend": "How did they contact you?",
  "num.channel.call": "Phone call",
  "num.channel.sms": "SMS",
  "num.channel.whatsapp": "WhatsApp",
  "num.channel.other": "Something else",
  "num.desc.label": "What did they ask you to do?",
  "num.desc.hint":
    "For example: “They said they were from my bank and asked for an OTP.” Please do not type any OTP, PIN or card number.",
  "num.desc.counter": "{n} of {max} characters",
  "num.desc.err.long": "Please keep this under {max} characters.",
  "num.submit": "Check this number",

  // ---- file checker
  "file.title": "Check a file",
  "file.intro":
    "Scammers send files on WhatsApp, SMS or email, pretending to be a bank app, a bill, a job letter or a court notice. It can be an app, a Windows program, a zip folder, a PDF or an Office document. Choose the file here and ASTRA checks whether a security service already knows it. ASTRA never opens, installs or runs the file.",
  "file.label": "File to check",
  "file.hint": "Choose the file you received (any type, up to 2 GB). Do not open or run it.",
  "file.never": "Your file never leaves your device. Only this fingerprint is sent.",
  "file.noOpen": "Please do not open, install or run this file.",
  "file.selected": "Chosen file: {name} ({size})",
  "file.submit": "Check this file",
  "file.hashing": "Reading the file on your device: {n}%. Large files can take a few minutes.",
  "file.fingerprint": "File fingerprint (SHA-256)",
  "file.fingerprint.note": "This is a short code made from the file. It cannot be turned back into the file.",
  "file.limits.title": "What this check cannot do",
  "file.limits":
    "It only covers files the security service has already seen.\nScammers can change a file for each victim, so a new file may be unknown.\nIt does not look at what the file would do. A zip folder is checked as a whole, not file by file.",
  "file.err.noFile": "Please choose a file first.",
  "file.err.tooBig":
    "This file is larger than 2 GB, which is too big to check here. Please choose a smaller file.",
  "file.err.memory":
    "This file is too large for your device to read right now. Close other apps and try again, or try on a computer.",
  "file.err.generic": "We could not read this file. Please try choosing it again.",
  "file.err.nocrypto":
    "This browser cannot create the file fingerprint here. Please use an up-to-date browser and open ASTRA over a secure (https) connection.",
  "size.kb": "{n} KB",
  "size.mb": "{n} MB",
  "size.gb": "{n} GB",

  // ---- api errors (also used by lib/client/api.ts)
  "err.network": "We could not reach ASTRA. Please check your internet connection and try again.",
  "err.timeout": "The check took too long. Please try again in a moment.",
  "err.rate": "Too many checks in a short time. Please wait a minute and try again.",
  "err.server": "Something went wrong on our side. Please try again in a moment.",
  "err.badResponse": "ASTRA sent back something we could not read. Please try again in a moment.",

  // ---- result view
  "result.announce": "Result ready: {state}",
  "result.complete": "Analysis complete",
  "state.potential_scam": "Potential Scam",
  "state.potential_scam.desc": "Strong warning signs were found. Please do not click, pay, install or reply.",
  "state.suspicious": "Suspicious",
  "state.suspicious.desc": "Some warning signs were found. Please be careful and check with the real organization first.",
  "state.likely_safe": "Likely Safe",
  "state.likely_safe.desc": "No significant warning signs were found by the checks that ran.",
  "state.likely_safe.caution":
    "This is not a guarantee. Always verify the sender independently, using the official app, the official website or a number you find yourself.",
  "state.unable": "We couldn't fully check this",
  "state.unable.desc":
    "Some checks could not be completed, so we cannot give a clear answer. Please verify independently.",
  "result.categories": "What this looks like",
  "result.requested": "What the sender may want you to do",
  "result.actions.title": "What you should do",
  "result.why.title": "Why it looks suspicious",
  "result.why.main": "Why we flagged it",
  "result.why.more": "More warning signs we found",
  "result.why.neutral": "What we noticed",
  "result.why.none": "We did not find clear warning signs in the text.",
  "indicator.official": "Official check",
  "indicator.analysis": "ASTRA's analysis",
  "indicator.evidence": "This line raised the warning:",
  "indicator.inferred": "This is based on the message as a whole, so there are no exact words to quote.",
  "result.links.title": "Links we looked at",
  "result.links.note": "We did not open these links. Please do not open them either.",
  "result.links.flags": "Things we noticed in the address",
  "result.links.noFlags": "Nothing unusual in the address text itself.",
  "result.links.reports": "Safety service reports",
  "result.provider.malicious": "Flagged as dangerous",
  "result.provider.suspicious": "Flagged as suspicious",
  "result.provider.notFound": "Not found in this provider's records, which does not mean safe",
  "result.provider.unavailable": "Could not check right now",
  "result.provider.threats": "Types of threat reported: {list}",
  "result.provider.report": "View the full report",
  "result.checks.title": "Checks that ran",
  "result.checks.legend":
    "“Unavailable” means a check could not run. It does not mean no problem was found.",
  "check.rules": "Scam-pattern check",
  "check.ai": "AI analysis",
  "check.url_reputation": "Link reputation lookup",
  "check.file_reputation": "File reputation lookup",
  "check.phone_reputation":
    "Number reputation lookup",
  "check.status.ran": "Completed",
  "check.status.unavailable": "Unavailable right now",
  "check.status.skipped": "Skipped",
  "check.status.not_applicable": "Not needed here",
  "result.file.title": "File check",
  "result.file.status.malicious": "Flagged as dangerous. Do not open or run this file.",
  "result.file.status.suspicious": "Flagged as suspicious. Do not open or run this file.",
  "result.file.status.no_detections":
    "No security engine flagged this file. That does not make the file or its sender trustworthy.",
  "result.file.status.not_found":
    "We could not find this file in VirusTotal's records. This is not a sign of safety. New or changed files are often unknown.",
  "result.file.status.unavailable": "Unable to check this file right now.",
  "result.file.engines": "Security engines that looked at it",
  "result.file.malicious": "Flagged as dangerous: {n}",
  "result.file.suspiciousCount": "Flagged as suspicious: {n}",
  "result.file.harmless": "Marked harmless: {n}",
  "result.file.undetected": "Found nothing: {n}",
  "result.file.threats": "Threat names reported",
  "result.file.first": "First seen",
  "result.file.last": "Last analyzed",
  "result.file.report": "View the full {provider} report",
  "result.phone.title": "About this number",
  "result.phone.masked": "Number (partly hidden)",
  "result.phone.country": "Country (from the number's code)",
  "result.phone.lineType": "Line type (from the numbering plan)",
  "result.phone.note": "This only describes the number's range. It does not show who is using the number or whether it is active.",
  "result.phone.rep.title":
    "What the number-reputation service reports",
  "result.phone.rep.provider":
    "Source: IPQualityScore. This is another company's record and can be wrong or out of date.",
  "result.phone.rep.carrier":
    "Carrier (reported)",
  "result.phone.rep.lineType":
    "Line type (reported)",
  "result.phone.rep.voip":
    "Internet calling (VoIP)",
  "result.phone.rep.prepaid":
    "Prepaid line",
  "result.phone.rep.flags":
    "Warnings from the service",
  "result.phone.rep.noFlags":
    "This service has no warning for this number. That does not prove the number is genuine.",
  "result.phone.rep.unavailable":
    "The number-reputation service could not be reached right now.",
  "common.yes":
    "Yes",
  "common.no":
    "No",
  "phone.flag.risky":
    "Reported as risky (for example linked to fraud, scams or robocalls)",
  "phone.flag.recent_abuse":
    "Linked to recent fraud or abuse",
  "phone.flag.spammer":
    "Reported for spam or harassing calls or texts",
  "phone.flag.high_fraud_score":
    "Given a high fraud rating by the service",
  "phone.line.mobile": "Mobile",
  "phone.line.landline": "Landline",
  "phone.line.mobile_or_landline": "Mobile or landline",
  "phone.line.voip": "Internet calling (VoIP)",
  "phone.line.toll_free": "Toll-free",
  "phone.line.premium": "Premium rate (calls can cost extra)",
  "phone.line.shared_cost": "Shared cost (calls can cost extra)",
  "phone.line.other": "Other",
  "result.limits.title": "What this check cannot tell you",
  "result.disclaimer": "AI analysis is not a guarantee of safety. Please use your own judgment too.",
  "result.aiUsed": "Part of this explanation was written by an AI model.",

  // ---- lost money panel
  "lost.title": "Lost money?",
  "lost.step1": "Contact your bank or payment provider first and tell them what happened.",
  "lost.call": "Call 1930",
  "lost.callNote": "Cyber fraud helpline",
  "lost.portal": "Report at cybercrime.gov.in",
  "lost.chakshu.title": "No money lost?",
  "lost.chakshu":
    "If you only got a suspicious call, message or link and lost no money, you can report it on Chakshu (Sanchar Saathi).",
  "lost.chakshu.link": "Open Chakshu on Sanchar Saathi",
  "lost.verify": "Please check the official websites for the current steps.",

  // ---- read aloud
  "read.button": "Read aloud",
  "read.stop": "Stop reading",
  "read.speaking": "Reading the result aloud.",
  "read.unavailable": "Read aloud is not available on this device for this language.",
  "read.script.reasons": "Main reasons.",
  "read.script.actions": "What to do.",

  // ---- share
  "share.title": "Share with family",
  "share.note":
    "This short summary has no message text, links, phone numbers or file codes. You choose who gets it.",
  "share.preview": "Summary that will be shared",
  "share.button": "Share…",
  "share.whatsapp": "Send on WhatsApp",
  "share.copy": "Copy summary",
  "share.copied": "Copied",
  "share.copyFailed": "Could not copy. Please select the summary above and copy it yourself.",
  "share.header": "ASTRA check: {state}",
  "share.looksLike": "What it looks like: {list}",
  "share.todo": "What to do: {action}",
  "share.footer": "Checked with ASTRA, a hackathon prototype. This is not a guarantee of safety.",
  "share.subject": "ASTRA safety check",

  // ---- categories (plain words)
  "cat.banking_kyc": "Fake bank or KYC message",
  "cat.upi_payment": "UPI or payment trick",
  "cat.government_impersonation": "Pretending to be a government office",
  "cat.delivery_customs": "Fake delivery or customs fee",
  "cat.utility_disconnection": "Fake electricity or utility threat",
  "cat.job_task": "Fake job or task offer",
  "cat.investment": "Fake investment offer",
  "cat.loan_credit": "Loan or credit trick",
  "cat.fake_support": "Fake customer support",
  "cat.remote_access_apk": "App install or remote access trick",
  "cat.family_emergency": "Fake family emergency",
  "cat.sextortion": "Blackmail or threats",
  "cat.prize_lottery": "Fake prize or lottery",
  "cat.gambling_spam": "Betting or casino promotion",
  "cat.credential_theft": "Attempt to steal logins or details",
  "cat.malicious_file": "Dangerous file",
  "cat.other": "Other warning signs",

  // ---- how it works page
  "how.title": "How ASTRA works",
  "how.intro":
    "ASTRA helps you slow down and think before you trust a message, a link or a phone call. Here is what happens when you use it.",
  "how.step1.title": "1. Submit",
  "how.step1.body":
    "Paste a message, enter a link or a phone number, or choose a file you received (an app, a program, a zip folder or a document). Before a message is sent for checking, your browser hides things like OTPs and card numbers and shows you exactly what will be checked. For a file, it stays on your device. Only a short fingerprint of it is sent.",
  "how.step2.title": "2. Analyze",
  "how.step2.body":
    "ASTRA looks for known scam patterns, such as urgent threats, requests for OTPs or PINs, and links that copy a real bank's name. When they are set up, an AI model helps explain the message, and a security service called VirusTotal is asked whether a link or file is already known to be dangerous. ASTRA never opens your links.",
  "how.step3.title": "3. Understand",
  "how.step3.body":
    "You get a clear result with the reasons, the exact words that worried us, and simple steps to take. You can listen to it read aloud, or share a short and private summary with a family member.",
  "how.results.title": "What the results mean",
  "how.learn.title": "Common scams and how to spot them",
  "how.learn.intro": "These tricks are widely reported in India. They all work by making you panic or hope, so you act before you think.",
  "how.otp.title": "OTP fraud",
  "how.otp.body":
    "An OTP (one-time password) is a secret code that lets money leave your account or lets someone log in as you. Real banks and companies never ask you to read out or forward an OTP. If someone asks for it by call, SMS or WhatsApp, treat it as a scam, even if they sound official.",
  "how.upi.title": "UPI collect requests and PIN tricks",
  "how.upi.body":
    "Your UPI PIN is only needed to send money. You never need it to receive money. If someone says “enter your PIN to get a refund”, or sends a collect request you did not expect, do not approve it. Approving a collect request takes money out of your account.",
  "how.kyc.title": "KYC and account-blocked messages",
  "how.kyc.body":
    "Messages that say your account, SIM or wallet will be blocked unless you complete KYC right now are a common trick. They usually ask you to tap a link or install an app. Open your bank's official app or visit a branch instead.",
  "how.delivery.title": "Fake delivery and customs fees",
  "how.delivery.body":
    "A message says a parcel is stuck and asks for a small fee, or asks you to confirm an address through a link. The small fee is often a way to get your card or UPI details. Check delivery status in the shop's own app or website.",
  "how.remote.title": "Remote access and APK scams",
  "how.remote.body":
    "Scammers send an app file (APK) on WhatsApp or SMS, or ask you to install a “support” or screen-sharing app. Once installed, they may be able to see your screen, read your messages and OTPs, and move money. Install apps only from the official Play Store, and never because someone on a call asked you to.",
  "how.arrest.title": "Digital arrest threats",
  "how.arrest.body":
    "A caller says they are from the police, CBI, customs or a court, and that you are under “digital arrest” or must stay on a video call. Real agencies do not arrest people over a video call or ask you to transfer money to prove you are innocent. Hang up and speak to someone you trust. If you are worried, you can call 1930.",
  "how.golden": "When in doubt: stop, do not click, and contact the organization using its official app, its official website or a number you find yourself.",
  "how.cta": "Check something now",

  // ---- about page
  "about.title": "About ASTRA",
  "about.name.title": "What the name means",
  "about.name.body":
    "ASTRA (अस्त्र) is a Sanskrit word for a weapon that is thrown or released, such as an arrow or a missile. A weapon held in the hand is called a shastra. In Indian tradition an astra is often remembered as a weapon used to protect. We chose the name because ASTRA is meant to be a tool that helps ordinary people defend themselves against scams. It shows you the warning signs so you can decide with confidence. No tool is perfect, so when in doubt, check with the official source.",
  "about.what.title": "What ASTRA is",
  "about.what.body":
    "ASTRA (अस्त्र) is a free tool that helps ordinary people, including older family members, check suspicious messages, links, phone numbers and app files. It explains warning signs in plain language, in English and Hindi, and tells you what to do next.",
  "about.cannot.title": "What ASTRA cannot do",
  "about.cannot.list":
    "It cannot prove that a message, link or person is safe or genuine.\nIt cannot tell you whether a phone number belongs to a scammer. A number on its own is described, not judged.\nIt cannot open links or look inside app files. It looks at the text of the address and, for files, a fingerprint.\nIt can make mistakes. New scams may not be recognized, and honest messages can sometimes look suspicious.\nIt does not get your money back and it does not contact anyone for you.",
  "about.proto.title": "A hackathon prototype",
  "about.proto.body":
    "ASTRA was built for a hackathon. It is not an official service of any government body, bank or company, and it has not been independently audited. The Hindi text still needs review by fluent speakers.",
  "about.providers.title": "Services ASTRA may use",
  "about.providers.body":
    "ASTRA runs its own scam-pattern rules on its server. When they are set up, it can also use the services below. If a service is not set up or not working, ASTRA tells you that the check did not run.",
  "about.providers.list":
    "An AI model: the message text you submit, after sensitive numbers are hidden, may be sent to the AI provider so it can help explain the message. If you choose to read text from a picture, the picture itself is also sent to the AI provider so it can copy out the words; it is not saved. If the main AI provider (Google Gemini) is unavailable, ASTRA may use a backup AI provider (OpenRouter or OpenCode), which then receives the same text or picture.\nVirusTotal: web addresses and file fingerprints (SHA-256 hashes) may be sent to VirusTotal to see whether they are already known. Your file itself is never uploaded.\nIPQualityScore (if set up): a phone number you check may be sent to it to see whether it has been flagged. What you describe is not sent to it.",
  "about.help.title": "Official help",
  "about.help.body": "If you lost money or want to report a scam, please use the official channels.",

  // ---- privacy page
  "privacy.title": "Privacy Policy",
  "privacy.proto":
    "ASTRA is a hackathon prototype. This page explains how it is designed to handle your information. It is not a legal document, and we do not claim compliance with any specific law.",
  "privacy.accounts.title": "No accounts",
  "privacy.accounts.body": "You do not sign up or log in. ASTRA does not ask for your name, phone number or email address.",
  "privacy.stored.title": "Your checks are not stored",
  "privacy.stored.body":
    "ASTRA is built not to store the messages, links, numbers or file fingerprints you check, and not to put them in its own logs. Results are shown on your screen only. When you close or refresh the page, they are gone. If you turn on the optional History page, a short summary of each check (type, result, date and a host name or masked number, never the message or picture) is kept in this browser only, for 7 days, and you can delete it at any time. The hosting service may keep basic technical records, such as the time of a request.",
  "privacy.redact.title": "Sensitive numbers are hidden first",
  "privacy.redact.body":
    "In your browser, ASTRA tries to hide OTPs, PINs, card numbers and long digit sequences before a message is sent. You see the exact text that will be sent. This is automatic and can miss things, so please remove anything private yourself.",
  "privacy.leaves.title": "What leaves your device, and when",
  "privacy.leaves.list":
    "Messages: when you press Check, the text (after hiding) is sent to ASTRA's server. If an AI model is set up, that text may be passed on to the AI provider. If Google Gemini is unavailable, a backup provider (OpenRouter or OpenCode) may receive it instead.\nPictures: if you use \"Read text from a picture\", the picture is sent to ASTRA's server and passed on to the AI provider, which copies out the text. Hidden details such as location are removed in your browser first. The picture is not saved. Pictures can show names and phone numbers, so crop them first if you can.\nLinks: the address is sent to ASTRA's server and may be sent to VirusTotal. ASTRA never opens the link.\nPhone numbers: the number and anything you describe are sent to ASTRA's server. If a number-reputation service (IPQualityScore) is set up, the number alone is also sent to it. That company says it may use submitted numbers to improve its service and does not state how long it keeps them. Country and line type come from data built into ASTRA, with no lookup.\nApp files: the file never leaves your device. Only its SHA-256 fingerprint is sent, and it may be sent to VirusTotal.",
  "privacy.nothing.title": "No analytics, no ads, no tracking",
  "privacy.nothing.body":
    "ASTRA does not use analytics or advertising tools and sets no cookies. The only thing saved in your browser is your language choice, in local storage. It stays on your device.",
  "privacy.third.title": "Other services",
  "privacy.third.body":
    "The AI provider and VirusTotal have their own privacy policies. Please do not put private details in what you check.",
  "privacy.share.title": "Sharing and reading aloud",
  "privacy.share.body":
    "The family summary is made in your browser. It has no message text, links, numbers or file fingerprints, and ASTRA does not send it anywhere. You choose who gets it. Read aloud uses the speech feature of your device or browser, and ASTRA does not receive any audio.",
  "privacy.contact": "Questions? See the Contact page.",

  // ---- terms page
  "terms.title": "Terms of Service",
  "terms.proto":
    "ASTRA is a hackathon prototype. These short terms are written in plain language and are not legal advice.",
  "terms.guidance.title": "Guidance only",
  "terms.guidance.body":
    "ASTRA gives guidance to help you spot possible scams. It is not legal, financial or professional advice, and it does not guarantee that anything is safe or unsafe.",
  "terms.use.title": "Using ASTRA",
  "terms.use.list":
    "Use ASTRA only for lawful purposes.\nDo not try to overload, attack or misuse the service. Limits on how often you can check may apply.\nDo not enter other people's private details, OTPs, PINs or passwords.\nYou are responsible for what you decide to do after seeing a result.",
  "terms.asis.title": "As is",
  "terms.asis.body":
    "ASTRA is provided as is, without promises of accuracy or availability. Results can be wrong or incomplete. The service may change or stop at any time.",
  "terms.official.title": "Official reporting",
  "terms.official.body":
    "ASTRA is not connected to any government body or bank. To report a crime, use the official channels such as cybercrime.gov.in and the 1930 helpline.",

  // ---- disclaimer page
  "disc.title": "Disclaimer",
  "disc.proto": "ASTRA is a hackathon prototype and not an official service of any government body, bank or company.",
  "disc.list":
    "AI analysis is not a guarantee of safety. It can be wrong.\n“Likely Safe” only means that no significant warning signs were found by the checks that ran. It does not mean a message, link or sender is verified.\nA file or link that is not in VirusTotal's records is not necessarily safe.\nA phone number cannot be judged on its own. ASTRA gives guidance, not a verdict.\nASTRA does not give legal, financial or investment advice.\nAlways confirm with your bank, a government office or a company using their official app, website or a number you find yourself.\nIf you are in danger or have lost money, contact your bank and the 1930 helpline straight away.",

  // ---- contact page
  "contact.title": "Contact",
  "contact.body":
    "Contact details will be added. ASTRA is a hackathon prototype and does not have a public support channel yet.",
  "contact.urgent.title": "If you lost money, do not wait for us",
  "contact.urgent.body":
    "Contact your bank or payment provider first. Then use the official channels below.",

  // ---- 404
  "nf.title": "We could not find that page",
  "nf.body": "The page you were looking for does not exist. You can go back to the home page and choose what to check.",
} satisfies Record<string, string>;

export type UiKey = keyof typeof en;

// ======================================================================= HINDI
// NOTE: This Hindi text was drafted quickly and NEEDS REVIEW BY A FLUENT HINDI
// SPEAKER before any public demo. Safety wording in particular should be checked.
const hi: Record<UiKey, string> = {
  // ---- brand / chrome
  "brand.name": "ASTRA",
  "brand.devanagari": "अस्त्र",
  "brand.home": "ASTRA होम",
  "nav.main": "मुख्य मेनू",
  "nav.home": "होम",
  "nav.how": "यह कैसे काम करता है",
  "nav.about": "हमारे बारे में",
  "nav.history": "इतिहास",
  "nav.getStarted": "शुरू करें",
  "nav.openMenu": "मेनू खोलें",
  "nav.closeMenu": "मेनू बंद करें",
  "nav.skip": "मुख्य सामग्री पर जाएं",
  "lang.group": "भाषा",
  "lang.enLabel": "English (अंग्रेज़ी)",
  "lang.hiLabel": "हिंदी",
  "lang.enShort": "EN",
  "lang.hiShort": "हिंदी",
  "common.opensNewTab": "(नए टैब में खुलेगा)",
  "common.loading": "लोड हो रहा है…",
  "common.back": "होम पर वापस जाएं",
  "error.title":
    "कुछ गड़बड़ हो गई",
  "error.body":
    "क्षमा करें, इस पेज में कोई समस्या आ गई। आपने जो लिखा था वह कहीं सहेजा या भेजा नहीं गया। कृपया दोबारा कोशिश करें।",
  "error.retry":
    "दोबारा कोशिश करें",

  // ---- footer
  "footer.about": "ASTRA के बारे में",
  "footer.privacy": "गोपनीयता नीति",
  "footer.terms": "सेवा की शर्तें",
  "footer.contact": "संपर्क",
  "footer.disclaimer": "अस्वीकरण",
  "footer.pages": "जानकारी",
  "footer.resources": "साइबर अपराध के लिए सरकारी मदद",
  "footer.ncrp": "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल",
  "footer.helpline": "साइबर ठगी हेल्पलाइन: 1930",
  "footer.chakshu": "संचार साथी पर चक्षु",
  "footer.proto":
    "ASTRA एक हैकाथॉन प्रोटोटाइप है। यह किसी सरकारी संस्था, बैंक या कंपनी की आधिकारिक सेवा नहीं है।",

  // ---- "I already did it" help (shown under warnings)
  "acted.title": "लिंक पर क्लिक कर दिया या OTP बता दिया?",
  "acted.intro": "घबराएं नहीं। जल्दी कदम उठाने से मदद मिलती है। जो हुआ वह खोलकर देखें:",
  "acted.clicked.title": "मैंने लिंक पर क्लिक कर दिया",
  "acted.clicked.steps":
    "पेज बंद कर दें। उसमें कुछ भी न लिखें और उस पर कुछ और न दबाएं।\nअगर आपने पासवर्ड, PIN या कार्ड की जानकारी डाल दी है, तो आधिकारिक ऐप से या किसी दूसरे डिवाइस से तुरंत वह पासवर्ड बदलें और अपने बैंक को फ़ोन करें।\nअगर कोई फ़ाइल डाउनलोड हुई है, तो उसे न खोलें। उसे मिटा दें। अगर कोई ऐप इंस्टॉल हुआ है, तो उसे अनइंस्टॉल कर दें।\nअगले कुछ दिनों तक अपने बैंक और UPI के संदेश देखते रहें और जो काम आपने नहीं किया उसकी शिकायत करें।",
  "acted.otp.title": "मैंने OTP, PIN या कार्ड की जानकारी बता दी",
  "acted.otp.steps":
    "अभी अपने बैंक को फ़ोन करें। नंबर अपने कार्ड से या आधिकारिक बैंक ऐप से लें, संदेश में दिया नंबर कभी नहीं। उनसे कार्ड, UPI या नेट बैंकिंग बंद करने को कहें।\nअपना UPI PIN, नेट-बैंकिंग पासवर्ड और कार्ड PIN बदलें।\nअपने हाल के लेन-देन देखें। अगर कोई पैसा गया है, तो जल्द से जल्द 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें।\nकोई और कोड कभी न बताएं, भले ही फ़ोन करने वाला कहे कि यह पहले वाले को रद्द या वापस करने के लिए है।",
  "acted.app.title": "मैंने कोई ऐप इंस्टॉल कर लिया या किसी को अपनी स्क्रीन दिखा दी",
  "acted.app.steps":
    "वाई-फ़ाई और मोबाइल डेटा बंद कर दें, ताकि सामने वाला आपका फ़ोन न देख सके और न चला सके।\nऐप को अनइंस्टॉल करें। सेटिंग्स में ऐसे ऐप भी देखें जिन्हें Accessibility या Device admin की अनुमति मिली है और जिन्हें आप नहीं पहचानते, और उन्हें हटा दें।\nकिसी दूसरे फ़ोन या कंप्यूटर से अपने बैंकिंग, ईमेल और UPI के पासवर्ड बदलें और अपने बैंक को फ़ोन करें।\nअगर आपको पक्का नहीं है कि फ़ोन साफ़ है, तो फ़ैक्ट्री रीसेट सबसे सुरक्षित है। पहले फ़ोटो और संपर्क का बैकअप ले लें।",
  "acted.id.title": "मैंने आधार, पैन या अपने पहचान पत्र की फ़ोटो भेज दी",
  "acted.id.steps":
    "इस व्यक्ति को और दस्तावेज़ या फ़ोटो न भेजें।\nआधिकारिक UIDAI वेबसाइट या mAadhaar ऐप पर आप अपने आधार का बायोमेट्रिक लॉक कर सकते हैं, ताकि कोई आपकी उंगली या आँख के निशान का इस्तेमाल न कर सके।\nआधिकारिक संचार साथी वेबसाइट पर आप देख सकते हैं कि आपके नाम पर कौन-से मोबाइल कनेक्शन हैं, और जिन्हें आप नहीं पहचानते उनकी शिकायत कर सकते हैं।\nलोन या क्रेडिट के प्रस्तावों और आपकी जानकारी का ज़िक्र करने वाले संदेशों से सावधान रहें। कुछ भी गड़बड़ दिखे तो cybercrime.gov.in पर या 1930 पर बताएं।",
  "acted.money.title": "मैं पैसे भेज चुका हूं",
  "acted.money.steps":
    "तुरंत अपने बैंक या पेमेंट ऐप को बताएं कि क्या हुआ और भुगतान रोकने या चिह्नित करने को कहें।\nजल्द से जल्द 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें। स्क्रीनशॉट, फ़ोन नंबर और लेन-देन की जानकारी तैयार रखें।\nऔर पैसे न भेजें, भले ही कोई फ़ीस लेकर पैसे वापस दिलाने की बात करे।\nआधिकारिक संपर्कों के लिए नीचे “पैसे कट गए?” वाला बॉक्स देखें।",

  // ---- history (opt-in, on this device)
  "history.title": "आपकी हाल की जांचें",
  "history.intro":
    "इस डिवाइस पर अपनी हाल की जांचों की छोटी सूची रखें, ताकि आप उन्हें दोबारा देख सकें। यह तब तक बंद रहती है जब तक आप इसे चालू न करें।",
  "history.optin": "मेरी हाल की जांचें इस डिवाइस पर सहेजें",
  "history.optin.hint":
    "सिर्फ़ एक छोटा सार सहेजा जाता है: जांच का प्रकार, नतीजा, तारीख, और वेबसाइट का नाम, छिपा हुआ फ़ोन नंबर या फ़ाइल फ़िंगरप्रिंट का शुरुआती हिस्सा। संदेश और तस्वीरें कभी नहीं सहेजे जाते। यह इसी ब्राउज़र में रहता है और ASTRA को कभी नहीं भेजा जाता। एंट्री {days} दिन बाद अपने आप मिट जाती हैं। इसे बंद करने पर सहेजा हुआ सब कुछ मिट जाता है।",
  "history.on": "चालू",
  "history.off": "बंद",
  "history.list": "सहेजी गई जांचें",
  "history.empty.off": "इतिहास बंद है। कुछ भी सहेजा नहीं जा रहा।",
  "history.empty.on": "अभी कोई जांच सहेजी नहीं गई है। आपकी अगली जांच यहां दिखेगी।",
  "history.clear": "सब मिटाएं",
  "history.remove": "हटाएं",
  "history.removeLabel": "इस जांच को इतिहास से हटाएं",
  "history.kind.message": "संदेश",
  "history.kind.url": "लिंक",
  "history.kind.phone": "फ़ोन नंबर",
  "history.kind.file": "फ़ाइल",

  // ---- dark-mode extension notice
  "darkNotice.body":
    "कोई डार्क-मोड एक्सटेंशन इस पेज के रंग बदल रहा है। चेतावनी के रंग ASTRA के इरादे से अलग दिख सकते हैं। सही नतीजों के लिए इस साइट पर एक्सटेंशन बंद कर दें।",
  "darkNotice.dismiss": "ठीक है",

  // ---- home
  "home.hero.title": "ऑनलाइन ठगी से सुरक्षित रहें।",
  "home.hero.desc":
    "किसी भी संदिग्ध संदेश, लिंक या फ़ोन नंबर पर भरोसा करने से पहले उसे जांचें। ASTRA एआई की मदद से संभावित ऑनलाइन खतरों को पहचानने में आपकी मदद करता है।",
  "home.hero.cta": "ठगी की जांच करें",
  "home.hero.secondary": "जानें यह कैसे काम करता है",
  "home.safetyNotice":
    "OTP, पासवर्ड, UPI PIN, पूरा कार्ड नंबर या बैंक की लॉगिन जानकारी किसी को न बताएं। संदेश की जांच के लिए ASTRA को इनकी ज़रूरत नहीं है।",
  "home.check.title": "आप क्या जांचना चाहते हैं?",
  "home.card.message.title": "संदिग्ध संदेश",
  "home.card.message.desc": "संदिग्ध SMS और टेक्स्ट बातचीत की जांच करें।",
  "home.card.message.btn": "संदेश जांचें",
  "home.card.link.title": "संदिग्ध वेबसाइट या लिंक",
  "home.card.link.desc": "जांचें कि कोई वेबसाइट या लिंक खतरनाक तो नहीं है।",
  "home.card.link.btn": "लिंक जांचें",
  "home.card.number.title": "अनजान फ़ोन नंबर",
  "home.card.number.desc": "ठगी की आशंका वाले फ़ोन नंबर के बारे में जानकारी पाएं।",
  "home.card.number.btn": "नंबर जांचें",
  "home.file.link": "कोई फ़ाइल (ऐप, प्रोग्राम, ज़िप, PDF) मिली है? उसे जांचें",
  "home.samples.title": "एक नमूना आज़माएं",
  "home.samples.intro":
    "समझ नहीं आ रहा कहां से शुरू करें? किसी नमूने पर टैप करें और देखें कि ASTRA नतीजा कैसे समझाता है। ये नमूने बनाए हुए संदेश हैं।",
  "sample.kyc.label": "नकली बैंक KYC संदेश",
  "sample.kyc.expect": "नकली लिंक वाला ठगी जैसा संदेश",
  "sample.upi.label": "UPI रिफंड की चाल",
  "sample.upi.expect": "पैसे पाने के लिए UPI PIN मांगने वाला संदेश",
  "sample.delivery.label": "सामान्य डिलीवरी सूचना",
  "sample.delivery.expect": "ऐसा संदेश जिसमें पैसे या कोड नहीं मांगे गए",
  "home.how.title": "यह कैसे काम करता है",
  "home.how.more": "ASTRA के काम करने के बारे में और पढ़ें",
  "home.how.1.title": "भेजें",
  "home.how.1.body": "जिस संदेश, लिंक या फ़ोन नंबर पर शक है, उसे दर्ज करें।",
  "home.how.2.title": "जांच",
  "home.how.2.body": "ASTRA एआई की मदद से उपलब्ध खतरे के संकेतों को जांचता है।",
  "home.how.3.title": "समझें",
  "home.how.3.body": "साफ़ और आसान भाषा में कारण और सुरक्षा के सुझाव पाएं।",
  "home.tips.title": "सतर्क रहें: पांच आसान आदतें",
  "home.tips.1": "OTP किसी को न बताएं, चाहे वह खुद को आपके बैंक का बताए।",
  "home.tips.2": "अपना बैंक PIN या UPI PIN कभी न बताएं। पैसे पाने के लिए PIN की ज़रूरत नहीं होती।",
  "home.tips.3": "अनजान लोगों के पेमेंट लिंक और QR कोड से बचें।",
  "home.tips.4": "अगर कोई बैंक या सरकारी विभाग से होने का दावा करे, तो फ़ोन काट दें और आधिकारिक नंबर पर खुद कॉल करें।",
  "home.tips.5": "साइबर अपराध की आशंका हो तो आधिकारिक माध्यमों से शिकायत करें।",
  "home.privacyNote":
    "ASTRA में खाता नहीं बनता और इसे इस तरह बनाया गया है कि आप जो जांचते हैं वह सहेजा न जाए। संदेश भेजने से पहले OTP और कार्ड नंबर आपके ब्राउज़र में छिपा दिए जाते हैं। वैकल्पिक इतिहास शुरू में बंद रहता है और आपके डिवाइस पर ही रहता है।",

  // ---- checker common
  "check.result.heading": "नतीजा",
  "check.loading": "जांच हो रही है। इसमें आमतौर पर कुछ सेकंड लगते हैं।",
  "check.example": "उदाहरण",
  "check.clear": "साफ़ करें",
  "check.required": "ज़रूरी",
  "check.optional": "वैकल्पिक",
  "demo.outage": "डेमो मोड: ऑनलाइन जांच बंद होने का नकली परीक्षण",
  "demo.outage.hint": "प्रदर्शन के लिए। चालू होने पर ASTRA ऐसा बर्ताव करता है जैसे उसकी बाहरी जांच सेवाएं नहीं मिल रहीं, ताकि आप देख सकें कि वह फिर भी काम करता है और ईमानदारी से बताता है। अभी:",
  "demo.on": "चालू",
  "demo.off": "बंद",
  "check.errorTitle": "जांच पूरी नहीं हो सकी",

  // ---- message checker
  "msg.title": "संदिग्ध संदेश की जांच करें",
  "msg.intro":
    "जो संदेश आपको मिला है उसे यहां पेस्ट करें। ASTRA ठगी के आम संकेत ढूंढता है और उन्हें सरल शब्दों में समझाता है।",
  "msg.label": "संदेश का टेक्स्ट",
  "msg.hint": "SMS, WhatsApp, ईमेल या सोशल मीडिया से संदेश कॉपी करें और यहां पेस्ट करें।",
  "msg.placeholder": "संदेश यहां पेस्ट करें",
  "msg.example": "Your bank account will be blocked today. Complete KYC immediately: https://sbi-verify-account.example",
  "msg.paste": "कॉपी किया संदेश पेस्ट करें",
  "msg.paste.denied":
    "हम आपका क्लिपबोर्ड नहीं पढ़ सके। कृपया बॉक्स में उंगली दबाकर रखें और पेस्ट चुनें।",
  "msg.paste.unsupported":
    "यह ब्राउज़र एक टैप में पेस्ट करने की अनुमति नहीं देता। कृपया बॉक्स में उंगली दबाकर रखें और पेस्ट चुनें।",
  "msg.paste.empty": "क्लिपबोर्ड में कुछ नहीं मिला। कृपया पहले संदेश कॉपी करें।",
  "msg.image": "तस्वीर से टेक्स्ट पढ़ें",
  "msg.image.privacy":
    "तस्वीर पढ़ने के लिए ASTRA उसे एक एआई सेवा को भेजता है, जो उसमें से टेक्स्ट निकालती है। तस्वीर सहेजी नहीं जाती। तस्वीरों में नाम और फोन नंबर दिख सकते हैं, इसलिए हो सके तो पहले उसे क्रॉप कर लें।",
  "msg.image.reading": "तस्वीर पढ़ी जा रही है… इसमें कुछ सेकंड लग सकते हैं।",
  "msg.image.done":
    "हमने आपकी तस्वीर से यह टेक्स्ट पढ़ा है। कृपया देख लें कि यह संदेश से मेल खाता है और गलतियां ठीक कर लें। फिर “इस संदेश को जांचें” दबाएं।",
  "msg.image.noText":
    "इस तस्वीर में हमें कोई टेक्स्ट नहीं मिला। कृपया ज़्यादा साफ़ स्क्रीनशॉट आज़माएं, या संदेश टाइप या पेस्ट करें।",
  "msg.image.badFile":
    "यह फ़ाइल तस्वीर के रूप में नहीं खुल सकी। कृपया कोई स्क्रीनशॉट या फोटो चुनें।",
  "msg.image.tooBig": "यह तस्वीर बहुत बड़ी है। कृपया छोटी तस्वीर या स्क्रीनशॉट चुनें।",
  "msg.image.failed": "अभी हम इस तस्वीर को नहीं पढ़ सके। कृपया संदेश टाइप या पेस्ट करें।",
  "msg.image.inputLabel": "संदेश का स्क्रीनशॉट या फोटो चुनें",
  "msg.counter": "{max} में से {n} अक्षर",
  "msg.err.short": "कृपया कम से कम {min} अक्षर लिखें ताकि ASTRA के पास जांचने के लिए कुछ हो।",
  "msg.err.long": "यह संदेश बहुत लंबा है। कृपया इसे {max} अक्षरों से कम रखें।",
  "msg.submit": "इस संदेश को जांचें",
  "msg.privacy":
    "संदेश समझाने के लिए ASTRA आपका डाला हुआ टेक्स्ट किसी एआई सेवा को भेज सकता है। पहले संवेदनशील नंबर छिपा दिए जाते हैं, और ASTRA आपका संदेश सहेजता नहीं है।",
  "redact.one": "जांच से पहले हमने 1 संवेदनशील चीज़ (जैसे OTP या कार्ड नंबर) छिपा दी।",
  "redact.many": "जांच से पहले हमने {n} संवेदनशील चीज़ें (जैसे OTP या कार्ड नंबर) छिपा दीं।",
  "redact.willSend": "जांच के लिए ठीक यही टेक्स्ट भेजा जाएगा:",
  "redact.caveat":
    "छिपाना अपने आप होता है और कुछ चीज़ें छूट सकती हैं। जांच से पहले कृपया कोई भी निजी जानकारी खुद हटा दें।",
  "links.title": "आपके संदेश में मिले लिंक",
  "links.noOpen": "हम इन लिंक को नहीं खोलेंगे।",

  // ---- link checker
  "link.title": "संदिग्ध लिंक या वेबसाइट की जांच करें",
  "link.intro":
    "जो लिंक आपको भेजा गया है उसे दर्ज करें। ASTRA उसे कभी नहीं खोलता। वह सिर्फ़ वेब पते को देखता है और सुरक्षा सेवाओं से पूछता है कि वे उसके बारे में क्या जानती हैं।",
  "link.label": "लिंक या वेबसाइट का पता",
  "link.hint": "पूरा पता पेस्ट करें। यह आमतौर पर https:// से शुरू होता है।",
  "link.example": "https://sbi-verify-account.example",
  "link.never": "ASTRA यह लिंक कभी नहीं खोलता। कृपया आप भी इसे न खोलें।",
  "link.privacy":
    "आपका डाला हुआ वेब पता किसी सुरक्षा सेवा (VirusTotal) को भेजा जा सकता है, ताकि पता चले कि वह पहले से खतरनाक के रूप में जाना जाता है या नहीं।",
  "link.err.empty": "कृपया कोई लिंक या वेबसाइट का पता लिखें।",
  "link.err.long": "यह पता बहुत लंबा है। कृपया देखें कि आपने सिर्फ़ लिंक कॉपी किया है।",
  "link.submit": "इस लिंक को जांचें",

  // ---- number checker
  "num.title": "अनजान फ़ोन नंबर की जांच करें",
  "num.intro": "जिस नंबर से कॉल या संदेश आया उसे लिखें। ASTRA बताएगा कि यह किस तरह का नंबर है और आपको क्या करना चाहिए।",
  "num.honest":
    "सिर्फ़ फ़ोन नंबर देखकर यह नहीं कहा जा सकता कि कोई ठग है या नहीं। ASTRA के पास अच्छे या बुरे नंबरों की कोई सूची नहीं है, इसलिए वह नंबर के बारे में फ़ैसला नहीं, सिर्फ़ सलाह देता है।",
  "num.label": "फ़ोन नंबर",
  "num.hint": "नंबर वैसा ही लिखें जैसा दिखा था।",
  "num.example": "98765 43210",
  "num.err.empty": "कृपया फ़ोन नंबर लिखें।",
  "num.channel.legend": "उन्होंने आपसे कैसे संपर्क किया?",
  "num.channel.call": "फ़ोन कॉल",
  "num.channel.sms": "SMS",
  "num.channel.whatsapp": "WhatsApp",
  "num.channel.other": "कुछ और",
  "num.desc.label": "उन्होंने आपसे क्या करने को कहा?",
  "num.desc.hint":
    "जैसे: “उन्होंने कहा कि वे मेरे बैंक से हैं और OTP मांगा।” कृपया यहां कोई OTP, PIN या कार्ड नंबर न लिखें।",
  "num.desc.counter": "{max} में से {n} अक्षर",
  "num.desc.err.long": "कृपया इसे {max} अक्षरों से कम रखें।",
  "num.submit": "इस नंबर को जांचें",

  // ---- file checker
  "file.title": "फ़ाइल की जांच करें",
  "file.intro":
    "ठग WhatsApp, SMS या ईमेल पर बैंक ऐप, बिल, नौकरी का पत्र या कोर्ट नोटिस बताकर फ़ाइलें भेजते हैं। यह कोई ऐप, विंडोज़ प्रोग्राम, ज़िप फ़ोल्डर, PDF या ऑफ़िस दस्तावेज़ हो सकता है। फ़ाइल यहां चुनें और ASTRA देखेगा कि कोई सुरक्षा सेवा उसे पहले से जानती है या नहीं। ASTRA फ़ाइल को कभी खोलता, इंस्टॉल करता या चलाता नहीं है।",
  "file.label": "जांचने के लिए फ़ाइल",
  "file.hint": "जो फ़ाइल मिली है उसे चुनें (कोई भी प्रकार, 2 GB तक)। उसे खोलें या चलाएं नहीं।",
  "file.never": "आपकी फ़ाइल आपके डिवाइस से बाहर नहीं जाती। सिर्फ़ यह फ़िंगरप्रिंट भेजा जाता है।",
  "file.noOpen": "कृपया इस फ़ाइल को न खोलें, न इंस्टॉल करें और न चलाएं।",
  "file.selected": "चुनी गई फ़ाइल: {name} ({size})",
  "file.submit": "इस फ़ाइल को जांचें",
  "file.hashing": "आपके डिवाइस पर फ़ाइल पढ़ी जा रही है: {n}%। बड़ी फ़ाइलों में कुछ मिनट लग सकते हैं।",
  "file.fingerprint": "फ़ाइल का फ़िंगरप्रिंट (SHA-256)",
  "file.fingerprint.note": "यह फ़ाइल से बना एक छोटा कोड है। इससे फ़ाइल वापस नहीं बनाई जा सकती।",
  "file.limits.title": "यह जांच क्या नहीं कर सकती",
  "file.limits":
    "यह सिर्फ़ उन फ़ाइलों को जांचती है जिन्हें सुरक्षा सेवा पहले देख चुकी है।\nठग हर शिकार के लिए फ़ाइल बदल सकते हैं, इसलिए नई फ़ाइल अनजानी हो सकती है।\nयह नहीं देखती कि फ़ाइल क्या करेगी। ज़िप फ़ोल्डर को एक पूरी फ़ाइल की तरह जांचा जाता है, अंदर की फ़ाइलों को अलग-अलग नहीं।",
  "file.err.noFile": "कृपया पहले कोई फ़ाइल चुनें।",
  "file.err.tooBig":
    "यह फ़ाइल 2 GB से बड़ी है, जो यहां जांचने के लिए बहुत बड़ी है। कृपया छोटी फ़ाइल चुनें।",
  "file.err.memory":
    "यह फ़ाइल आपके डिवाइस के लिए अभी पढ़ने में बहुत बड़ी है। दूसरे ऐप बंद करके फिर कोशिश करें, या कंप्यूटर पर कोशिश करें।",
  "file.err.generic": "हम यह फ़ाइल नहीं पढ़ सके। कृपया इसे दोबारा चुनकर देखें।",
  "file.err.nocrypto":
    "यह ब्राउज़र यहां फ़ाइल का फ़िंगरप्रिंट नहीं बना सकता। कृपया नया ब्राउज़र इस्तेमाल करें और ASTRA को सुरक्षित (https) कनेक्शन पर खोलें।",
  "size.kb": "{n} KB",
  "size.mb": "{n} MB",
  "size.gb": "{n} GB",

  // ---- api errors
  "err.network": "हम ASTRA तक नहीं पहुंच सके। कृपया अपना इंटरनेट कनेक्शन देखें और फिर कोशिश करें।",
  "err.timeout": "जांच में बहुत समय लग गया। कृपया थोड़ी देर बाद फिर कोशिश करें।",
  "err.rate": "थोड़े समय में बहुत ज़्यादा जांच हो गईं। कृपया एक मिनट रुककर फिर कोशिश करें।",
  "err.server": "हमारी तरफ़ से कुछ गड़बड़ हो गई। कृपया थोड़ी देर बाद फिर कोशिश करें।",
  "err.badResponse": "ASTRA ने ऐसा जवाब भेजा जिसे हम पढ़ नहीं सके। कृपया थोड़ी देर बाद फिर कोशिश करें।",

  // ---- result view
  "result.announce": "नतीजा तैयार है: {state}",
  "result.complete": "जांच पूरी हुई",
  "state.potential_scam": "संभावित ठगी",
  "state.potential_scam.desc": "इसमें ठगी के मज़बूत संकेत मिले हैं। कृपया क्लिक, भुगतान, इंस्टॉल या जवाब न दें।",
  "state.suspicious": "संदिग्ध",
  "state.suspicious.desc": "इसमें कुछ चेतावनी के संकेत मिले हैं। कृपया सावधान रहें और पहले असली संस्था से पूछकर पक्का करें।",
  "state.likely_safe": "शायद सुरक्षित",
  "state.likely_safe.desc": "जो जांचें की गईं उनमें कोई बड़ा चेतावनी संकेत नहीं मिला।",
  "state.likely_safe.caution":
    "यह कोई गारंटी नहीं है। भेजने वाले को हमेशा खुद अलग से परखें: आधिकारिक ऐप, आधिकारिक वेबसाइट या खुद ढूंढे हुए नंबर से।",
  "state.unable": "हम इसकी पूरी जांच नहीं कर सके",
  "state.unable.desc":
    "कुछ जांचें पूरी नहीं हो सकीं, इसलिए हम साफ़ जवाब नहीं दे सकते। कृपया खुद अलग से पक्का करें।",
  "result.categories": "यह किस तरह का लगता है",
  "result.requested": "भेजने वाला आपसे क्या करवाना चाहता है",
  "result.actions.title": "आपको क्या करना चाहिए",
  "result.why.title": "यह संदिग्ध क्यों लगता है",
  "result.why.main": "हमने इसे क्यों चिह्नित किया",
  "result.why.more": "चेतावनी के और संकेत जो हमें मिले",
  "result.why.neutral": "हमने क्या देखा",
  "result.why.none": "टेक्स्ट में हमें चेतावनी के साफ़ संकेत नहीं मिले।",
  "indicator.official": "आधिकारिक जांच",
  "indicator.analysis": "ASTRA का विश्लेषण",
  "indicator.evidence": "इस पंक्ति से चेतावनी मिली:",
  "indicator.inferred": "यह पूरे संदेश को देखकर निकाला गया है, इसलिए उद्धृत करने के लिए कोई सटीक शब्द नहीं हैं।",
  "result.links.title": "जो लिंक हमने देखे",
  "result.links.note": "हमने इन लिंक को नहीं खोला। कृपया आप भी इन्हें न खोलें।",
  "result.links.flags": "पते में हमें क्या दिखा",
  "result.links.noFlags": "पते के टेक्स्ट में कुछ असामान्य नहीं मिला।",
  "result.links.reports": "सुरक्षा सेवाओं की रिपोर्ट",
  "result.provider.malicious": "खतरनाक के रूप में चिह्नित",
  "result.provider.suspicious": "संदिग्ध के रूप में चिह्नित",
  "result.provider.notFound": "इस सेवा के रिकॉर्ड में नहीं मिला, इसका मतलब यह नहीं कि यह सुरक्षित है",
  "result.provider.unavailable": "अभी जांच नहीं हो सकी",
  "result.provider.threats": "बताए गए खतरे के प्रकार: {list}",
  "result.provider.report": "पूरी रिपोर्ट देखें",
  "result.checks.title": "जो जांचें हुईं",
  "result.checks.legend":
    "“उपलब्ध नहीं” का मतलब है कि जांच चल नहीं सकी। इसका मतलब यह नहीं कि कोई समस्या नहीं मिली।",
  "check.rules": "ठगी के पैटर्न की जांच",
  "check.ai": "एआई विश्लेषण",
  "check.url_reputation": "लिंक की साख की जांच",
  "check.file_reputation": "फ़ाइल की साख की जांच",
  "check.phone_reputation":
    "नंबर की रेपुटेशन जाँच",
  "check.status.ran": "पूरी हुई",
  "check.status.unavailable": "अभी उपलब्ध नहीं",
  "check.status.skipped": "छोड़ी गई",
  "check.status.not_applicable": "यहां ज़रूरी नहीं",
  "result.file.title": "फ़ाइल की जांच",
  "result.file.status.malicious": "खतरनाक के रूप में चिह्नित। इस फ़ाइल को न खोलें और न चलाएं।",
  "result.file.status.suspicious": "संदिग्ध के रूप में चिह्नित। इस फ़ाइल को न खोलें और न चलाएं।",
  "result.file.status.no_detections":
    "किसी सुरक्षा इंजन ने इस फ़ाइल को चिह्नित नहीं किया। इससे फ़ाइल या भेजने वाला भरोसेमंद साबित नहीं हो जाता।",
  "result.file.status.not_found":
    "यह फ़ाइल हमें VirusTotal के रिकॉर्ड में नहीं मिली। यह सुरक्षित होने का संकेत नहीं है। नई या बदली हुई फ़ाइलें अक्सर अनजानी होती हैं।",
  "result.file.status.unavailable": "अभी इस फ़ाइल की जांच नहीं हो सकी।",
  "result.file.engines": "जिन सुरक्षा इंजनों ने इसे देखा",
  "result.file.malicious": "खतरनाक चिह्नित: {n}",
  "result.file.suspiciousCount": "संदिग्ध चिह्नित: {n}",
  "result.file.harmless": "हानिरहित माना: {n}",
  "result.file.undetected": "कुछ नहीं मिला: {n}",
  "result.file.threats": "बताए गए खतरे के नाम",
  "result.file.first": "पहली बार देखी गई",
  "result.file.last": "आखिरी बार जांची गई",
  "result.file.report": "{provider} की पूरी रिपोर्ट देखें",
  "result.phone.title": "इस नंबर के बारे में",
  "result.phone.masked": "नंबर (आंशिक रूप से छिपा)",
  "result.phone.country": "देश (नंबर के कोड से)",
  "result.phone.lineType": "लाइन का प्रकार (नंबरिंग योजना से)",
  "result.phone.note": "यह सिर्फ़ नंबर की रेंज बताता है। इससे यह पता नहीं चलता कि नंबर कौन इस्तेमाल कर रहा है या वह चालू है या नहीं।",
  "result.phone.rep.title":
    "नंबर की रेपुटेशन सेवा क्या बताती है",
  "result.phone.rep.provider":
    "स्रोत: IPQualityScore। यह किसी दूसरी कंपनी का रिकॉर्ड है और गलत या पुराना हो सकता है।",
  "result.phone.rep.carrier":
    "कैरियर (सेवा के अनुसार)",
  "result.phone.rep.lineType":
    "लाइन का प्रकार (सेवा के अनुसार)",
  "result.phone.rep.voip":
    "इंटरनेट कॉलिंग (VoIP)",
  "result.phone.rep.prepaid":
    "प्रीपेड लाइन",
  "result.phone.rep.flags":
    "सेवा की चेतावनियां",
  "result.phone.rep.noFlags":
    "इस सेवा ने इस नंबर पर कोई चेतावनी नहीं दी है। इसका मतलब यह साबित नहीं होता कि नंबर असली है।",
  "result.phone.rep.unavailable":
    "अभी नंबर की रेपुटेशन सेवा तक पहुंच नहीं हो सकी।",
  "common.yes":
    "हां",
  "common.no":
    "नहीं",
  "phone.flag.risky":
    "जोखिम भरा बताया गया (जैसे ठगी, स्कैम या रोबोकॉल से जुड़ा)",
  "phone.flag.recent_abuse":
    "हाल की ठगी या दुरुपयोग से जुड़ा",
  "phone.flag.spammer":
    "स्पैम या परेशान करने वाले कॉल या संदेशों के लिए रिपोर्ट किया गया",
  "phone.flag.high_fraud_score":
    "सेवा ने इसे ऊंची ठगी रेटिंग दी है",
  "phone.line.mobile": "मोबाइल",
  "phone.line.landline": "लैंडलाइन",
  "phone.line.mobile_or_landline": "मोबाइल या लैंडलाइन",
  "phone.line.voip": "इंटरनेट कॉलिंग (VoIP)",
  "phone.line.toll_free": "टोल-फ्री",
  "phone.line.premium": "प्रीमियम रेट (कॉल पर ज़्यादा पैसे लग सकते हैं)",
  "phone.line.shared_cost": "साझा लागत (कॉल पर ज़्यादा पैसे लग सकते हैं)",
  "phone.line.other": "अन्य",
  "result.limits.title": "यह जांच क्या नहीं बता सकती",
  "result.disclaimer": "एआई विश्लेषण सुरक्षा की गारंटी नहीं है। कृपया अपनी समझ से भी काम लें।",
  "result.aiUsed": "इस स्पष्टीकरण का एक हिस्सा एआई मॉडल ने लिखा है।",

  // ---- lost money panel
  "lost.title": "पैसे कट गए?",
  "lost.step1": "सबसे पहले अपने बैंक या पेमेंट कंपनी से संपर्क करें और उन्हें बताएं कि क्या हुआ।",
  "lost.call": "1930 पर कॉल करें",
  "lost.callNote": "साइबर ठगी हेल्पलाइन",
  "lost.portal": "cybercrime.gov.in पर शिकायत करें",
  "lost.chakshu.title": "पैसे नहीं कटे?",
  "lost.chakshu":
    "अगर आपको सिर्फ़ संदिग्ध कॉल, संदेश या लिंक मिला और पैसे नहीं कटे, तो आप चक्षु (संचार साथी) पर इसकी शिकायत कर सकते हैं।",
  "lost.chakshu.link": "संचार साथी पर चक्षु खोलें",
  "lost.verify": "ताज़ा तरीके के लिए कृपया आधिकारिक वेबसाइट देखें।",

  // ---- read aloud
  "read.button": "बोलकर सुनें",
  "read.stop": "पढ़ना रोकें",
  "read.speaking": "नतीजा बोलकर पढ़ा जा रहा है।",
  "read.unavailable": "इस डिवाइस पर इस भाषा में बोलकर सुनाने की सुविधा उपलब्ध नहीं है।",
  "read.script.reasons": "मुख्य कारण।",
  "read.script.actions": "क्या करें।",

  // ---- share
  "share.title": "परिवार के साथ साझा करें",
  "share.note":
    "इस छोटे सारांश में संदेश का टेक्स्ट, लिंक, फ़ोन नंबर या फ़ाइल कोड नहीं है। किसे भेजना है, यह आप चुनते हैं।",
  "share.preview": "जो सारांश साझा होगा",
  "share.button": "साझा करें…",
  "share.whatsapp": "WhatsApp पर भेजें",
  "share.copy": "सारांश कॉपी करें",
  "share.copied": "कॉपी हो गया",
  "share.copyFailed": "कॉपी नहीं हो सका। कृपया ऊपर का सारांश चुनकर खुद कॉपी करें।",
  "share.header": "ASTRA जांच: {state}",
  "share.looksLike": "यह किस तरह का लगता है: {list}",
  "share.todo": "क्या करें: {action}",
  "share.footer": "ASTRA से जांचा गया, जो एक हैकाथॉन प्रोटोटाइप है। यह सुरक्षा की गारंटी नहीं है।",
  "share.subject": "ASTRA सुरक्षा जांच",

  // ---- categories
  "cat.banking_kyc": "नकली बैंक या KYC संदेश",
  "cat.upi_payment": "UPI या पेमेंट की चाल",
  "cat.government_impersonation": "सरकारी दफ़्तर बनकर ठगी",
  "cat.delivery_customs": "नकली डिलीवरी या कस्टम्स शुल्क",
  "cat.utility_disconnection": "बिजली या सेवा कटने की नकली धमकी",
  "cat.job_task": "नकली नौकरी या टास्क का ऑफ़र",
  "cat.investment": "नकली निवेश का ऑफ़र",
  "cat.loan_credit": "लोन या क्रेडिट की चाल",
  "cat.fake_support": "नकली कस्टमर सपोर्ट",
  "cat.remote_access_apk": "ऐप इंस्टॉल कराने या रिमोट एक्सेस की चाल",
  "cat.family_emergency": "परिवार में नकली इमरजेंसी",
  "cat.sextortion": "ब्लैकमेल या धमकी",
  "cat.prize_lottery": "नकली इनाम या लॉटरी",
  "cat.gambling_spam": "सट्टेबाज़ी या कैसीनो का प्रचार",
  "cat.credential_theft": "लॉगिन या जानकारी चुराने की कोशिश",
  "cat.malicious_file": "खतरनाक फ़ाइल",
  "cat.other": "चेतावनी के अन्य संकेत",

  // ---- how it works page
  "how.title": "ASTRA कैसे काम करता है",
  "how.intro":
    "ASTRA आपको रुककर सोचने में मदद करता है, इससे पहले कि आप किसी संदेश, लिंक या फ़ोन कॉल पर भरोसा करें। इस्तेमाल करने पर यह होता है।",
  "how.step1.title": "1. भेजें",
  "how.step1.body":
    "कोई संदेश पेस्ट करें, लिंक या फ़ोन नंबर लिखें, या कोई मिली हुई फ़ाइल (ऐप, प्रोग्राम, ज़िप फ़ोल्डर या दस्तावेज़) चुनें। संदेश जांच के लिए भेजने से पहले आपका ब्राउज़र OTP और कार्ड नंबर जैसी चीज़ें छिपा देता है और आपको दिखाता है कि ठीक क्या जांचा जाएगा। फ़ाइल आपके डिवाइस पर ही रहती है। सिर्फ़ उसका एक छोटा फ़िंगरप्रिंट भेजा जाता है।",
  "how.step2.title": "2. जांच",
  "how.step2.body":
    "ASTRA ठगी के जाने-पहचाने पैटर्न ढूंढता है, जैसे जल्दबाज़ी की धमकी, OTP या PIN की मांग, और असली बैंक के नाम की नकल करने वाले लिंक। जब ये सेटअप हों, तो एक एआई मॉडल संदेश को समझाने में मदद करता है और VirusTotal नाम की सुरक्षा सेवा से पूछा जाता है कि कोई लिंक या फ़ाइल पहले से खतरनाक के रूप में जानी जाती है या नहीं। ASTRA आपके लिंक कभी नहीं खोलता।",
  "how.step3.title": "3. समझें",
  "how.step3.body":
    "आपको कारणों, चिंता वाले ठीक-ठीक शब्दों और करने के आसान कदमों के साथ साफ़ नतीजा मिलता है। आप इसे बोलकर सुन सकते हैं, या परिवार के किसी सदस्य के साथ छोटा और निजी सारांश साझा कर सकते हैं।",
  "how.results.title": "नतीजों का मतलब",
  "how.learn.title": "ठगी के आम तरीके और उन्हें कैसे पहचानें",
  "how.learn.intro": "भारत में इन चालों की खूब शिकायतें आती हैं। ये सब आपको डराकर या लालच देकर काम करती हैं, ताकि आप सोचने से पहले कदम उठा लें।",
  "how.otp.title": "OTP ठगी",
  "how.otp.body":
    "OTP (वन-टाइम पासवर्ड) एक गुप्त कोड है जिससे आपके खाते से पैसे निकल सकते हैं या कोई आपकी जगह लॉगिन कर सकता है। असली बैंक या कंपनियां कभी OTP बताने या आगे भेजने को नहीं कहतीं। अगर कोई कॉल, SMS या WhatsApp पर इसे मांगे, तो उसे ठगी मानें, चाहे वह कितना भी आधिकारिक लगे।",
  "how.upi.title": "UPI कलेक्ट रिक्वेस्ट और PIN की चालें",
  "how.upi.body":
    "UPI PIN की ज़रूरत सिर्फ़ पैसे भेजने के लिए होती है। पैसे पाने के लिए इसकी कभी ज़रूरत नहीं होती। अगर कोई कहे “रिफंड पाने के लिए PIN डालें”, या ऐसी कलेक्ट रिक्वेस्ट भेजे जिसकी आपको उम्मीद नहीं थी, तो उसे मंज़ूर न करें। कलेक्ट रिक्वेस्ट मंज़ूर करने से आपके खाते से पैसे निकलते हैं।",
  "how.kyc.title": "KYC और खाता बंद होने के संदेश",
  "how.kyc.body":
    "जिन संदेशों में लिखा हो कि अभी KYC पूरा नहीं किया तो आपका खाता, सिम या वॉलेट बंद हो जाएगा, वे ठगी की आम चाल हैं। इनमें अक्सर लिंक पर टैप करने या ऐप इंस्टॉल करने को कहा जाता है। इसके बजाय अपने बैंक का आधिकारिक ऐप खोलें या शाखा में जाएं।",
  "how.delivery.title": "नकली डिलीवरी और कस्टम्स शुल्क",
  "how.delivery.body":
    "संदेश कहता है कि आपका पार्सल अटका है और थोड़ी फ़ीस मांगता है, या लिंक से पता कन्फ़र्म करने को कहता है। यह छोटी फ़ीस अक्सर आपके कार्ड या UPI की जानकारी लेने का तरीका होती है। डिलीवरी की स्थिति दुकान के अपने ऐप या वेबसाइट पर देखें।",
  "how.remote.title": "रिमोट एक्सेस और APK ठगी",
  "how.remote.body":
    "ठग WhatsApp या SMS पर ऐप फ़ाइल (APK) भेजते हैं, या “सपोर्ट” या स्क्रीन-शेयरिंग ऐप इंस्टॉल करने को कहते हैं। इंस्टॉल होने के बाद वे आपकी स्क्रीन देख सकते हैं, आपके संदेश और OTP पढ़ सकते हैं और पैसे निकाल सकते हैं। ऐप सिर्फ़ आधिकारिक Play Store से इंस्टॉल करें, और कॉल पर किसी के कहने पर कभी नहीं।",
  "how.arrest.title": "“डिजिटल अरेस्ट” की धमकी",
  "how.arrest.body":
    "कॉल करने वाला खुद को पुलिस, CBI, कस्टम्स या अदालत से बताता है और कहता है कि आप “डिजिटल अरेस्ट” में हैं या वीडियो कॉल पर बने रहें। असली एजेंसियां वीडियो कॉल पर गिरफ़्तार नहीं करतीं और बेगुनाही साबित करने के लिए पैसे ट्रांसफ़र करने को नहीं कहतीं। फ़ोन काट दें और किसी भरोसेमंद व्यक्ति से बात करें। चिंता हो तो आप 1930 पर कॉल कर सकते हैं।",
  "how.golden": "शक हो तो रुकें, क्लिक न करें, और संस्था से उसके आधिकारिक ऐप, आधिकारिक वेबसाइट या खुद ढूंढे हुए नंबर से संपर्क करें।",
  "how.cta": "अभी कुछ जांचें",

  // ---- about page
  "about.title": "ASTRA के बारे में",
  "about.name.title": "नाम का मतलब",
  "about.name.body":
    "ASTRA (अस्त्र) संस्कृत का शब्द है। इसका अर्थ है ऐसा हथियार जिसे फेंका या छोड़ा जाता है, जैसे बाण या मिसाइल। हाथ में पकड़कर चलाए जाने वाले हथियार को शस्त्र कहते हैं। भारतीय परंपरा में अस्त्र को अक्सर रक्षा करने वाले हथियार के रूप में याद किया जाता है। हमने यह नाम इसलिए चुना क्योंकि ASTRA का मकसद आम लोगों को ठगी से अपनी रक्षा करने में मदद करने वाला एक औज़ार बनना है। यह आपको चेतावनी के संकेत दिखाता है, ताकि आप भरोसे के साथ फ़ैसला ले सकें। कोई भी टूल पूरी तरह सही नहीं होता, इसलिए शक होने पर आधिकारिक स्रोत से पक्का कर लें।",
  "about.what.title": "ASTRA क्या है",
  "about.what.body":
    "ASTRA (अस्त्र) एक मुफ़्त टूल है जो आम लोगों, बुज़ुर्ग परिवार जनों समेत, को संदिग्ध संदेश, लिंक, फ़ोन नंबर और ऐप फ़ाइलें जांचने में मदद करता है। यह अंग्रेज़ी और हिंदी में चेतावनी के संकेत सरल भाषा में समझाता है और बताता है कि आगे क्या करें।",
  "about.cannot.title": "ASTRA क्या नहीं कर सकता",
  "about.cannot.list":
    "यह साबित नहीं कर सकता कि कोई संदेश, लिंक या व्यक्ति सुरक्षित या असली है।\nयह नहीं बता सकता कि कोई फ़ोन नंबर ठग का है या नहीं। सिर्फ़ नंबर का वर्णन किया जाता है, उस पर फ़ैसला नहीं।\nयह लिंक नहीं खोल सकता और ऐप फ़ाइल के अंदर नहीं देख सकता। यह पते के टेक्स्ट को और फ़ाइल के मामले में उसके फ़िंगरप्रिंट को देखता है।\nइससे गलती हो सकती है। नई ठगी पहचानी न जाए, या सही संदेश कभी-कभी संदिग्ध दिख सकते हैं।\nयह आपके पैसे वापस नहीं दिलाता और आपकी तरफ़ से किसी से संपर्क नहीं करता।",
  "about.proto.title": "एक हैकाथॉन प्रोटोटाइप",
  "about.proto.body":
    "ASTRA एक हैकाथॉन के लिए बनाया गया है। यह किसी सरकारी संस्था, बैंक या कंपनी की आधिकारिक सेवा नहीं है, और इसकी किसी स्वतंत्र संस्था से जांच नहीं हुई है। हिंदी टेक्स्ट की अभी किसी धाराप्रवाह हिंदी जानकार से समीक्षा होनी बाकी है।",
  "about.providers.title": "ASTRA किन सेवाओं का इस्तेमाल कर सकता है",
  "about.providers.body":
    "ASTRA अपने सर्वर पर ठगी के पैटर्न के अपने नियम चलाता है। जब ये सेटअप हों, तो नीचे दी गई सेवाएं भी इस्तेमाल हो सकती हैं। अगर कोई सेवा सेटअप नहीं है या काम नहीं कर रही, तो ASTRA आपको बताता है कि वह जांच नहीं चली।",
  "about.providers.list":
    "एआई मॉडल: आपका डाला हुआ संदेश टेक्स्ट, संवेदनशील नंबर छिपाने के बाद, एआई सेवा को भेजा जा सकता है ताकि वह संदेश समझाने में मदद करे। अगर आप तस्वीर से टेक्स्ट पढ़ना चुनते हैं, तो तस्वीर भी एआई सेवा को भेजी जाती है ताकि वह शब्द निकाल सके; तस्वीर सहेजी नहीं जाती। अगर मुख्य एआई सेवा (Google Gemini) उपलब्ध नहीं है, तो ASTRA बैकअप एआई सेवा (OpenRouter या OpenCode) इस्तेमाल कर सकता है, जिसे वही टेक्स्ट या तस्वीर मिलती है।\nVirusTotal: वेब पते और फ़ाइल फ़िंगरप्रिंट (SHA-256 हैश) VirusTotal को भेजे जा सकते हैं ताकि पता चले कि वे पहले से जाने-पहचाने हैं या नहीं। आपकी फ़ाइल खुद कभी अपलोड नहीं होती।\nIPQualityScore (अगर सेटअप हो): आप जो फ़ोन नंबर जांचते हैं वह उसे भेजा जा सकता है, ताकि पता चले कि उस पर कोई चेतावनी है या नहीं। आप जो बताते हैं वह उसे नहीं भेजा जाता।",
  "about.help.title": "आधिकारिक मदद",
  "about.help.body": "अगर आपके पैसे कट गए हैं या आप ठगी की शिकायत करना चाहते हैं, तो कृपया आधिकारिक माध्यमों का इस्तेमाल करें।",

  // ---- privacy page
  "privacy.title": "गोपनीयता नीति",
  "privacy.proto":
    "ASTRA एक हैकाथॉन प्रोटोटाइप है। यह पेज बताता है कि इसे आपकी जानकारी कैसे संभालने के लिए बनाया गया है। यह कानूनी दस्तावेज़ नहीं है, और हम किसी खास कानून के पालन का दावा नहीं करते।",
  "privacy.accounts.title": "कोई खाता नहीं",
  "privacy.accounts.body": "आपको साइन अप या लॉगिन नहीं करना पड़ता। ASTRA आपका नाम, फ़ोन नंबर या ईमेल नहीं मांगता।",
  "privacy.stored.title": "आपकी जांचें सहेजी नहीं जातीं",
  "privacy.stored.body":
    "ASTRA को इस तरह बनाया गया है कि आप जो संदेश, लिंक, नंबर या फ़ाइल फ़िंगरप्रिंट जांचते हैं उन्हें वह सहेजे नहीं और अपने लॉग में न डाले। नतीजे सिर्फ़ आपकी स्क्रीन पर दिखते हैं। पेज बंद या रीफ़्रेश करने पर वे मिट जाते हैं। अगर आप वैकल्पिक इतिहास पेज चालू करते हैं, तो हर जांच का छोटा सार (प्रकार, नतीजा, तारीख और होस्ट का नाम या छिपा हुआ नंबर, संदेश या तस्वीर कभी नहीं) सिर्फ़ इसी ब्राउज़र में 7 दिन तक रखा जाता है, और आप उसे कभी भी मिटा सकते हैं। होस्टिंग सेवा कुछ बुनियादी तकनीकी रिकॉर्ड रख सकती है, जैसे अनुरोध का समय।",
  "privacy.redact.title": "संवेदनशील नंबर पहले छिपाए जाते हैं",
  "privacy.redact.body":
    "आपके ब्राउज़र में ASTRA संदेश भेजने से पहले OTP, PIN, कार्ड नंबर और लंबे अंक छिपाने की कोशिश करता है। जो टेक्स्ट भेजा जाएगा वह आपको ठीक वैसा ही दिखता है। यह अपने आप होता है और कुछ छूट सकता है, इसलिए कृपया कोई भी निजी जानकारी खुद हटा दें।",
  "privacy.leaves.title": "आपके डिवाइस से क्या बाहर जाता है, और कब",
  "privacy.leaves.list":
    "संदेश: जब आप जांचें दबाते हैं, तो (छिपाने के बाद का) टेक्स्ट ASTRA के सर्वर को भेजा जाता है। अगर एआई मॉडल सेटअप है, तो वह टेक्स्ट एआई सेवा को आगे भेजा जा सकता है। अगर Google Gemini उपलब्ध नहीं है, तो उसकी जगह बैकअप सेवा (OpenRouter या OpenCode) को भेजा जा सकता है।\nतस्वीरें: अगर आप “तस्वीर से टेक्स्ट पढ़ें” इस्तेमाल करते हैं, तो तस्वीर ASTRA के सर्वर को भेजी जाती है और फिर एआई सेवा को, जो उसमें से टेक्स्ट निकालती है। लोकेशन जैसी छिपी जानकारी पहले आपके ब्राउज़र में हटा दी जाती है। तस्वीर सहेजी नहीं जाती। तस्वीरों में नाम और फोन नंबर दिख सकते हैं, इसलिए हो सके तो पहले उन्हें क्रॉप कर लें।\nलिंक: पता ASTRA के सर्वर को भेजा जाता है और VirusTotal को भी भेजा जा सकता है। ASTRA लिंक कभी नहीं खोलता।\nफ़ोन नंबर: नंबर और जो आप बताते हैं वह ASTRA के सर्वर को भेजा जाता है। अगर नंबर की रेपुटेशन सेवा (IPQualityScore) सेटअप है, तो सिर्फ़ नंबर उसे भी भेजा जाता है। वह कंपनी बताती है कि वह भेजे गए नंबरों से अपनी सेवा सुधार सकती है और यह नहीं बताती कि उन्हें कितने समय रखती है। देश और लाइन का प्रकार ASTRA में बने डेटा से आते हैं, किसी लुकअप से नहीं।\nऐप फ़ाइलें: फ़ाइल आपके डिवाइस से बाहर नहीं जाती। सिर्फ़ उसका SHA-256 फ़िंगरप्रिंट भेजा जाता है, और वह VirusTotal को भी भेजा जा सकता है।",
  "privacy.nothing.title": "कोई एनालिटिक्स, विज्ञापन या ट्रैकिंग नहीं",
  "privacy.nothing.body":
    "ASTRA एनालिटिक्स या विज्ञापन के टूल इस्तेमाल नहीं करता और कोई कुकी नहीं लगाता। आपके ब्राउज़र में सिर्फ़ आपकी भाषा की पसंद लोकल स्टोरेज में सहेजी जाती है। वह आपके डिवाइस पर ही रहती है।",
  "privacy.third.title": "दूसरी सेवाएं",
  "privacy.third.body":
    "एआई सेवा और VirusTotal की अपनी गोपनीयता नीतियां हैं। कृपया जो आप जांचें उसमें निजी जानकारी न डालें।",
  "privacy.share.title": "साझा करना और बोलकर सुनना",
  "privacy.share.body":
    "परिवार के लिए सारांश आपके ब्राउज़र में बनता है। उसमें संदेश का टेक्स्ट, लिंक, नंबर या फ़ाइल फ़िंगरप्रिंट नहीं होता, और ASTRA उसे कहीं नहीं भेजता। किसे भेजना है, यह आप चुनते हैं। बोलकर सुनाने की सुविधा आपके डिवाइस या ब्राउज़र की आवाज़ का इस्तेमाल करती है, और ASTRA को कोई ऑडियो नहीं मिलता।",
  "privacy.contact": "सवाल हैं? संपर्क पेज देखें।",

  // ---- terms page
  "terms.title": "सेवा की शर्तें",
  "terms.proto":
    "ASTRA एक हैकाथॉन प्रोटोटाइप है। ये छोटी शर्तें सरल भाषा में लिखी गई हैं और कानूनी सलाह नहीं हैं।",
  "terms.guidance.title": "सिर्फ़ मार्गदर्शन",
  "terms.guidance.body":
    "ASTRA संभावित ठगी पहचानने में मदद के लिए सलाह देता है। यह कानूनी, वित्तीय या पेशेवर सलाह नहीं है, और यह गारंटी नहीं देता कि कुछ भी सुरक्षित या असुरक्षित है।",
  "terms.use.title": "ASTRA का इस्तेमाल",
  "terms.use.list":
    "ASTRA का इस्तेमाल सिर्फ़ कानूनी कामों के लिए करें।\nसेवा पर ज़्यादा बोझ डालने, हमला करने या गलत इस्तेमाल की कोशिश न करें। कितनी बार जांच कर सकते हैं, इस पर सीमा हो सकती है।\nदूसरे लोगों की निजी जानकारी, OTP, PIN या पासवर्ड न डालें।\nनतीजा देखने के बाद आप जो करते हैं, उसकी ज़िम्मेदारी आपकी है।",
  "terms.asis.title": "जैसा है वैसा",
  "terms.asis.body":
    "ASTRA जैसा है वैसा दिया जाता है, सटीकता या उपलब्धता के किसी वादे के बिना। नतीजे गलत या अधूरे हो सकते हैं। सेवा कभी भी बदल या बंद हो सकती है।",
  "terms.official.title": "आधिकारिक शिकायत",
  "terms.official.body":
    "ASTRA किसी सरकारी संस्था या बैंक से जुड़ा नहीं है। अपराध की शिकायत के लिए cybercrime.gov.in और 1930 हेल्पलाइन जैसे आधिकारिक माध्यम इस्तेमाल करें।",

  // ---- disclaimer page
  "disc.title": "अस्वीकरण",
  "disc.proto": "ASTRA एक हैकाथॉन प्रोटोटाइप है, किसी सरकारी संस्था, बैंक या कंपनी की आधिकारिक सेवा नहीं।",
  "disc.list":
    "एआई विश्लेषण सुरक्षा की गारंटी नहीं है। यह गलत हो सकता है।\n“शायद सुरक्षित” का मतलब सिर्फ़ इतना है कि जो जांचें चलीं उनमें कोई बड़ा चेतावनी संकेत नहीं मिला। इसका मतलब यह नहीं कि संदेश, लिंक या भेजने वाला सत्यापित है।\nजो फ़ाइल या लिंक VirusTotal के रिकॉर्ड में नहीं है, वह ज़रूरी नहीं कि सुरक्षित हो।\nफ़ोन नंबर को अकेले परखा नहीं जा सकता। ASTRA फ़ैसला नहीं, सलाह देता है।\nASTRA कानूनी, वित्तीय या निवेश की सलाह नहीं देता।\nहमेशा अपने बैंक, सरकारी दफ़्तर या कंपनी से उनके आधिकारिक ऐप, वेबसाइट या खुद ढूंढे हुए नंबर पर पक्का करें।\nअगर आप खतरे में हैं या आपके पैसे कट गए हैं, तो तुरंत अपने बैंक और 1930 हेल्पलाइन से संपर्क करें।",

  // ---- contact page
  "contact.title": "संपर्क",
  "contact.body":
    "संपर्क की जानकारी जल्द जोड़ी जाएगी। ASTRA एक हैकाथॉन प्रोटोटाइप है और अभी इसका कोई सार्वजनिक सहायता माध्यम नहीं है।",
  "contact.urgent.title": "अगर पैसे कट गए हैं, तो हमारा इंतज़ार न करें",
  "contact.urgent.body":
    "सबसे पहले अपने बैंक या पेमेंट कंपनी से संपर्क करें। फिर नीचे दिए आधिकारिक माध्यम इस्तेमाल करें।",

  // ---- 404
  "nf.title": "हमें वह पेज नहीं मिला",
  "nf.body": "आप जिस पेज को ढूंढ रहे थे वह मौजूद नहीं है। आप होम पेज पर लौटकर चुन सकते हैं कि क्या जांचना है।",
};

export const dictionaries: Record<Lang, Record<UiKey, string>> = { en, hi };

export type UiVars = Record<string, string | number>;

/** Look up a UI string and fill {placeholders}. */
export function translate(lang: Lang, key: UiKey, vars?: UiVars): string {
  const raw = dictionaries[lang][key] ?? dictionaries.en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Both languages for one key. Useful for messages created outside React. */
export function bilingual(key: UiKey): Bilingual {
  return { en: en[key], hi: hi[key] };
}

/** Split long copy into paragraphs ("\n\n" separated). */
export function paragraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

/** Split list copy into items ("\n" separated). */
export function lines(text: string): string[] {
  return text.split("\n").map((p) => p.trim()).filter(Boolean);
}
