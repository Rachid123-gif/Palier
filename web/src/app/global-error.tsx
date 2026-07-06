"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f1ea" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Une erreur est survenue</h2>
          <p style={{ marginTop: 8, color: "#666", fontSize: 14 }}>{error.message || "Veuillez réessayer."}</p>
          <button
            onClick={reset}
            style={{ marginTop: 20, padding: "10px 24px", background: "#1e5b50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
