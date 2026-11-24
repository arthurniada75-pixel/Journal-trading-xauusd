import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import TradeJournal from "./components/TradeJournal";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href
        }
      });

      setLoading(false);

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Compte créé. Vérifie ta boîte e-mail pour confirmer ton adresse."
        );
      }

      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setMessage("Connexion impossible. Vérifie ton e-mail et ton mot de passe.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session) {
    return (
      <main className="page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">A</span>
            <span>Aurum Journal</span>
          </div>

          <button className="button secondary" onClick={handleLogout}>
            Déconnexion
          </button>
        </header>

        <section className="welcome">
          <p className="eyebrow">JOURNAL DE TRADING · XAUUSD</p>
          <h1>Bienvenue</h1>
          <p className="muted">Connecté en tant que {session.user.email}</p>
        </section>

        <section className="panel">
          <h2>Calendrier économique</h2>
          <p className="muted">
            Événements économiques américains à surveiller pour le XAUUSD.
          </p>

          <iframe
            title="Calendrier économique TradingView"
            src={`${import.meta.env.BASE_URL}calendar.html`}
            loading="lazy"
            style={{
              width: "100%",
              height: "620px",
              border: 0,
              borderRadius: "12px"
            }}
          />
        </section>

        <TradeJournal />
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <span className="brand-mark">A</span>
        <p className="eyebrow">VOTRE ESPACE DE TRADING</p>
        <h1>{mode === "login" ? "Aurum Journal" : "Créer un compte"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Connecte-toi à ton journal XAUUSD."
            : "Inscris-toi avec une adresse autorisée pour accéder au journal."}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <button className="button" type="submit" disabled={loading}>
            {loading
              ? "Patiente…"
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <button
          className="button secondary"
          style={{ width: "100%", marginTop: 12 }}
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Pas encore de compte ? S’inscrire"
            : "J’ai déjà un compte"}
        </button>
      </section>
    </main>
  );
}
