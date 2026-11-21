/**
 * Brands that Indian scammers commonly imitate, with the registrable domains the brand
 * genuinely uses. This is a small hand-made list for a prototype, not a complete registry.
 * It must be reviewed against official sources before it is relied on for anything else.
 *
 * `keys` are the lowercase names to look for inside a hostname. `official` lists registrable
 * domains (the part you could buy, e.g. "sbi.co.in", "onlinesbi.sbi") that are genuine.
 * `officialTlds` are suffixes only the brand can use (for example ".sbi").
 */
export type Brand = {
  id: string;
  keys: string[];
  official: string[];
  officialTlds?: string[];
};

export const BRANDS: Brand[] = [
  { id: "sbi", keys: ["sbi"], official: ["sbi.co.in", "onlinesbi.com", "sbicard.com", "sbilife.co.in", "sbimf.com", "sbigeneral.in", "yonosbi.com", "sbi.bank.in", "onlinesbi.sbi"], officialTlds: ["sbi"] },
  { id: "hdfc", keys: ["hdfc"], official: ["hdfcbank.com", "hdfc.com", "hdfclife.com", "hdfcsec.com", "hdfcergo.com", "hdfcfund.com", "hdfcbank.net", "hdfcbank.bank.in"] },
  { id: "icici", keys: ["icici"], official: ["icicibank.com", "icici.com", "icicidirect.com", "iciciprulife.com", "icicilombard.com", "icicipruamc.com", "icicibank.bank.in"] },
  { id: "axis", keys: ["axis"], official: ["axisbank.com", "axismf.com", "axisdirect.in", "axismaxlife.com", "axisbank.co.in", "axis.bank.in"] },
  { id: "kotak", keys: ["kotak"], official: ["kotak.com", "kotak811.com", "kotaksecurities.com", "kotak.bank.in"] },
  { id: "pnb", keys: ["pnb"], official: ["pnbindia.in", "netpnb.com", "pnbhousing.com", "pnbmetlife.com", "pnb.bank.in"] },
  { id: "bob", keys: ["bankofbaroda", "bankbaroda"], official: ["bankofbaroda.in", "bankofbaroda.com", "bankofbaroda.co.in"] },
  { id: "boi", keys: ["bankofindia"], official: ["bankofindia.co.in", "bankofindia.com"] },
  { id: "canara", keys: ["canara"], official: ["canarabank.com", "canarabank.in", "canarabank.bank.in"] },
  { id: "union", keys: ["unionbank"], official: ["unionbankofindia.co.in", "unionbankofindia.bank.in"] },
  { id: "idfc", keys: ["idfc"], official: ["idfcfirstbank.com"] },
  { id: "yes", keys: ["yesbank"], official: ["yesbank.in"] },
  { id: "indusind", keys: ["indusind"], official: ["indusind.com", "indusindbank.com"] },
  { id: "paytm", keys: ["paytm"], official: ["paytm.com", "paytmbank.com", "paytmmall.com", "paytm.in"] },
  { id: "phonepe", keys: ["phonepe"], official: ["phonepe.com", "phon.pe"] },
  { id: "gpay", keys: ["gpay", "googlepay"], official: ["google.com", "pay.google", "gpay.app"] },
  { id: "bhim", keys: ["bhim", "npci"], official: ["npci.org.in", "bhimupi.org.in"] },
  { id: "irctc", keys: ["irctc"], official: ["irctc.co.in", "irctc.com", "irctctourism.com", "irctc.in"] },
  { id: "indiapost", keys: ["indiapost"], official: ["indiapost.gov.in"] },
  { id: "bluedart", keys: ["bluedart"], official: ["bluedart.com"] },
  { id: "dtdc", keys: ["dtdc"], official: ["dtdc.com", "dtdc.in"] },
  { id: "delhivery", keys: ["delhivery"], official: ["delhivery.com"] },
  { id: "fedex", keys: ["fedex"], official: ["fedex.com"] },
  { id: "uidai", keys: ["uidai"], official: ["uidai.gov.in", "myaadhaar.uidai.gov.in"] },
  { id: "incometax", keys: ["incometax"], official: ["incometax.gov.in", "incometaxindia.gov.in"] },
  { id: "epfo", keys: ["epfo", "epfindia"], official: ["epfindia.gov.in", "epfo.gov.in"] },
  { id: "tatapower", keys: ["tatapower"], official: ["tatapower.com", "tatapower-ddl.com"] },
  { id: "bses", keys: ["bses"], official: ["bsesdelhi.com"] },
  { id: "adani", keys: ["adanielectricity"], official: ["adanielectricity.com"] },
  { id: "mahadiscom", keys: ["mahadiscom", "msedcl"], official: ["mahadiscom.in", "msedcl.in"] },
  { id: "amazon", keys: ["amazon"], official: ["amazon.in", "amazon.com", "amazon.co.uk", "amazonpay.in", "amazonaws.com", "amazontrust.com", "amazon-adsystem.com", "amazon.jobs"] },
  { id: "flipkart", keys: ["flipkart"], official: ["flipkart.com"] },
];

/** Suffixes controlled by governments / regulated bodies: never treated as a brand lookalike. */
export const TRUSTED_SUFFIXES = new Set(["gov.in", "nic.in", "gov", "mil.in", "bank.in", "fin.in"]);

/** Words scammers glue onto a brand name ("sbi-online", "hdfc-kyc"). Used for short brand keys. */
export const BRAND_AFFIXES = new Set([
  "bank", "online", "net", "netbanking", "secure", "login", "kyc", "verify", "verification", "update", "care",
  "pay", "card", "cards", "customer", "support", "help", "reward", "rewards", "yono", "mobile", "my", "app",
  "id", "account", "acc", "india", "ltd", "limited", "seva", "alert", "refund", "claim", "new", "official",
  "service", "services", "portal", "web", "otp", "fast", "quick", "wallet", "upi", "cashback", "offer",
]);
