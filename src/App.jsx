import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    if (error) setMessage("Connexion impossible. Vérifie ton e-mail et ton mot de passe.");
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
          <h2>Votre espace de trading</h2>
          <p className="muted">
            La connexion fonctionne. Nous ajouterons le journal et le calendrier ensuite.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <span className="brand-mark">A</span>
        <p className="eyebrow">VOTRE ESPACE DE TRADING</p>
        <h1>Aurum Journal</h1>
        <p className="muted">Connectez-vous à votre journal XAUUSD.</p>

        <form className="form" onSubmit={handleLogin}>
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
              required
            />
          </label>

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}
