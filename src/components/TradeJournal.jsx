import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function getLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const emptyForm = () => ({
  trade_date: getLocalDateTime(),
  direction: "Achat",
  entry_price: "",
  exit_price: "",
  lot_size: "",
  pnl: "",
  notes: ""
});

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    setLoading(true);

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false });

    if (error) {
      setMessage("Impossible de charger les trades pour le moment.");
    } else {
      setTrades(data ?? []);
    }

    setLoading(false);
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      setMessage("Reconnecte-toi avant d’enregistrer un trade.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      symbol: "XAUUSD",
      direction: form.direction,
      trade_date: new Date(form.trade_date).toISOString(),
      entry_price: Number(form.entry_price),
      exit_price: form.exit_price ? Number(form.exit_price) : null,
      lot_size: Number(form.lot_size),
      pnl: form.pnl === "" ? null : Number(form.pnl),
      notes: form.notes.trim() || null
    });

    setSaving(false);

    if (error) {
      setMessage("Le trade n’a pas été enregistré. Vérifie les champs.");
      return;
    }

    setForm(emptyForm());
    setMessage("Trade enregistré.");
    await loadTrades();
  }

  return (
    <>
      <section className="panel">
        <h2>Ajouter un trade XAUUSD</h2>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Date et heure
            <input
              name="trade_date"
              type="datetime-local"
              value={form.trade_date}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Direction
            <select
              name="direction"
              value={form.direction}
              onChange={updateField}
            >
              <option value="Achat">Achat</option>
              <option value="Vente">Vente</option>
            </select>
          </label>

          <label>
            Prix d’entrée
            <input
              name="entry_price"
              type="number"
              step="0.01"
              value={form.entry_price}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Prix de sortie
            <input
              name="exit_price"
              type="number"
              step="0.01"
              value={form.exit_price}
              onChange={updateField}
            />
          </label>

          <label>
            Taille en lots
            <input
              name="lot_size"
              type="number"
              min="0.01"
              step="0.01"
              value={form.lot_size}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Résultat en dollars
            <input
              name="pnl"
              type="number"
              step="0.01"
              value={form.pnl}
              onChange={updateField}
            />
          </label>

          <label>
            Notes
            <input
              name="notes"
              type="text"
              value={form.notes}
              onChange={updateField}
            />
          </label>

          <button className="button" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer le trade"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="panel">
        <h2>Journal partagé</h2>

        {loading ? (
          <p className="muted">Chargement des trades…</p>
        ) : trades.length === 0 ? (
          <p className="muted">Aucun trade enregistré pour l’instant.</p>
        ) : (
          <div className="table-wrap">
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Direction</th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Lots</th>
                  <th>Résultat</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{formatDate(trade.trade_date)}</td>
                    <td>{trade.direction}</td>
                    <td>{formatMoney(trade.entry_price)}</td>
                    <td>
                      {trade.exit_price == null
                        ? "Ouvert"
                        : formatMoney(trade.exit_price)}
                    </td>
                    <td>{trade.lot_size}</td>
                    <td>
                      {trade.pnl == null ? "—" : formatMoney(trade.pnl)}
                    </td>
                    <td>{trade.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
