/**
 * "Try a sample" messages (spec section 17). All are made up and use reserved
 * `.example` domains. The home page links to /check/message?sample=<id>, so no
 * message text is ever put in a URL for samples.
 */
export type SampleId = "kyc" | "upi" | "delivery";

export type Sample = {
  id: SampleId;
  text: string;
};

export const SAMPLES: readonly Sample[] = [
  {
    id: "kyc",
    text: "Your bank account will be blocked today. Complete KYC immediately:\nhttps://sbi-verify-account.example\nDo not ignore this message.",
  },
  {
    id: "upi",
    text: "Your refund is ready. Scan the QR code and enter your UPI PIN\nto receive the money. Offer expires in 10 minutes.",
  },
  {
    id: "delivery",
    text: "Example Store: your order EX-2041 has been delivered and left at your door. Thank you for shopping with us. If something is wrong, open the Example Store app and go to Orders.",
  },
];

export function getSample(id: string | null | undefined): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}
