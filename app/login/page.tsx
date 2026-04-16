"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const supabase = createClient();

  async function handleEmail() {
    setLoading(true); setError(""); setInfo("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Väärä sähköposti tai salasana.");
      else window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Tarkista sähköpostisi ja vahvista tili!");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) { setError("Google-kirjautuminen epäonnistui."); setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", border: "1px solid var(--border)", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, background: "var(--bg)",
    outline: "none", color: "var(--text)", fontFamily: "inherit"
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 8 }}>Muistiapuri</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Henkilökohtainen päiväkirjasi</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--bg)", borderRadius: 10, padding: 4 }}>
            {(["login","register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }} style={{
                flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--muted)",
                fontWeight: mode === m ? 700 : 300,
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s"
              }}>
                {m === "login" ? "Kirjaudu" : "Luo tili"}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: 10,
            background: "var(--surface)", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 20, color: "var(--text)", transition: "all 0.15s"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Jatka Googlella
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>tai</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email + password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Sähköposti" style={inp} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmail()}
              placeholder="Salasana" style={inp} />
          </div>

          {error && <p style={{ color: "var(--clay)", fontSize: 13, marginTop: 12 }}>⚠ {error}</p>}
          {info  && <p style={{ color: "var(--pine)", fontSize: 13, marginTop: 12 }}>✓ {info}</p>}

          <button onClick={handleEmail} disabled={loading || !email || !password} style={{
            width: "100%", marginTop: 16, padding: "13px", background: "var(--pine)",
            color: "#fff", border: "none", borderRadius: 10, cursor: loading ? "wait" : "pointer",
            fontSize: 14, fontFamily: "inherit", fontWeight: 700, opacity: (!email || !password) ? 0.5 : 1,
            transition: "opacity 0.15s"
          }}>
            {loading ? "Odota..." : mode === "login" ? "Kirjaudu sisään" : "Luo tili"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 24 }}>
          Tietosi tallennetaan turvallisesti ja ne ovat vain sinun.
        </p>
      </div>
    </div>
  );
}
