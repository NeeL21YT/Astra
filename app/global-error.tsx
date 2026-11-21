"use client";

/**
 * Last-resort page if the root layout itself crashes. It replaces the whole document, so it cannot
 * use the app's language setting or styles: it shows both languages in plain markup.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, color: "#172033", background: "#ffffff" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 20px" }} role="alert">
          <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Sorry, ASTRA ran into a problem. Nothing you typed was saved or sent anywhere. Please try again.
          </p>
          <h2 lang="hi" style={{ fontSize: 24, margin: "28px 0 8px" }}>
            कुछ गड़बड़ हो गई
          </h2>
          <p lang="hi" style={{ fontSize: 18, lineHeight: 1.6 }}>
            क्षमा करें, ASTRA में कोई समस्या आ गई। आपने जो लिखा था वह कहीं सहेजा या भेजा नहीं गया। कृपया दोबारा कोशिश करें।
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              minHeight: 52,
              padding: "0 24px",
              fontSize: 18,
              fontWeight: 600,
              color: "#ffffff",
              background: "#173B67",
              border: 0,
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Try again · दोबारा कोशिश करें
          </button>
        </main>
      </body>
    </html>
  );
}
