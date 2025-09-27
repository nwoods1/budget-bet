import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { acceptBet, addTransaction, fetchBet, finalizeBet } from "../api/bets";
import { useAuth } from "../contexts/authContext";
import { useApiUser } from "../hooks/useApiUser";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function BetDetails() {
  const { betId } = useParams();
  const { userLoggedIn } = useAuth();
  const { apiUser, loading: userLoading } = useApiUser();
  const [bet, setBet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [occurredOn, setOccurredOn] = useState("");

  const loadBet = useMemo(
    () => async () => {
      if (!betId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBet(betId);
        setBet(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [betId],
  );

  useEffect(() => {
    loadBet();
  }, [loadBet]);

  const participant = useMemo(() => {
    if (!bet || !apiUser) return null;
    return bet.participants.find((item) => item.auth_id === apiUser.auth_id);
  }, [bet, apiUser]);

  const progress = useMemo(() => {
    if (!bet || !participant) return 0;
    if (!bet.budget_limit) return 0;
    return Math.min(100, Math.round(((participant.spending || 0) / bet.budget_limit) * 100));
  }, [bet, participant]);

  const acceptedCount = bet?.participants.filter((p) => p.accepted).length || 0;
  const allAccepted = bet ? acceptedCount === bet.participants.length : false;

  const handleAccept = async () => {
    if (!apiUser) return;
    setMessage(null);
    try {
      const updated = await acceptBet(betId, apiUser.auth_id);
      setBet(updated);
      setMessage({ type: "success", text: "Bet accepted – good luck!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleAddTransaction = async (event) => {
    event.preventDefault();
    if (!apiUser) return;
    setTransactionError(null);
    setTransactionLoading(true);
    try {
      const updated = await addTransaction(betId, {
        authId: apiUser.auth_id,
        amount,
        merchant,
        category,
        occurredOn,
      });
      setBet(updated);
      setMerchant("");
      setAmount("0");
      setCategory("");
      setOccurredOn("");
      setMessage({ type: "success", text: "Purchase added" });
    } catch (err) {
      setTransactionError(err.message);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleFinalize = async () => {
    setMessage(null);
    try {
      const updated = await finalizeBet(betId);
      setBet(updated);
      setMessage({ type: "success", text: "Bet finalized" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (!userLoggedIn) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to view this bet</h1>
        <p className="mt-2 text-slate-600">Log in to view the live standings and add your purchases.</p>
      </div>
    );
  }

  if (userLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 p-6 text-rose-700">
        Unable to load this bet: {error.message}
      </div>
    );
  }

  if (!bet) {
    return null;
  }

  const yourSpend = participant?.spending || 0;
  const winner = bet.participants.find((p) => p.auth_id === bet.winner_auth_id);

  return (
    <div className="space-y-10">
      <header className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Budget bet</p>
            <h1 className="text-3xl font-semibold text-slate-900">{bet.title}</h1>
            <p className="mt-2 text-sm text-slate-600">Deadline {formatDate(bet.deadline)}</p>
            <p className="mt-2 text-sm text-slate-600">Budget per person {currency.format(bet.budget_limit)}</p>
            {bet.description && <p className="mt-4 text-slate-600">{bet.description}</p>}
          </div>
          <div className="text-right">
            <span className="rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase text-indigo-700">
              {bet.status}
            </span>
            <p className="mt-2 text-xs text-slate-500">
              {acceptedCount}/{bet.participants.length} accepted • {allAccepted ? "Everyone is in" : "Waiting on approvals"}
            </p>
            {bet.status === "completed" && winner && (
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                Winner: {winner.display_name || winner.username || winner.auth_id}
              </p>
            )}
          </div>
        </div>
        {message && (
          <div
            className={`mt-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              message.type === "error" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </header>

      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Your progress</h2>
            <p className="mt-1 text-sm text-slate-600">
              You&apos;ve spent {currency.format(yourSpend)} of your {currency.format(bet.budget_limit)} budget.
            </p>
          </div>
          {participant && !participant.accepted && (
            <button
              onClick={handleAccept}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600"
            >
              Accept bet
            </button>
          )}
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${progress > 80 ? "bg-rose-500" : "bg-indigo-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          {bet.participants.map((participantItem) => (
            <div
              key={participantItem.auth_id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {participantItem.display_name || participantItem.username || participantItem.auth_id}
                </p>
                <p className="text-xs text-slate-500">
                  {participantItem.accepted ? "Accepted" : "Waiting"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Spent</p>
                <p className="text-sm font-semibold text-slate-900">
                  {currency.format(participantItem.spending || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {bet.status !== "completed" && participant?.accepted && (
          <form onSubmit={handleAddTransaction} className="mt-8 space-y-4 rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Log a purchase</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Merchant</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  placeholder="Groceries, rent, etc."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Dining, Bills, Travel..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  required
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            {transactionError && <p className="text-sm font-semibold text-rose-600">{transactionError}</p>}
            <button
              type="submit"
              disabled={transactionLoading}
              className="inline-flex items-center rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {transactionLoading ? "Adding..." : "Add transaction"}
            </button>
          </form>
        )}

        {bet.status !== "completed" && (
          <button
            onClick={handleFinalize}
            className="mt-6 inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Finalize bet &amp; crown winner
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>
        {bet.transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No transactions logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bet.transactions.map((transaction) => {
              const txnParticipant = bet.participants.find((p) => p.auth_id === transaction.auth_id);
              return (
                <li
                  key={transaction._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{transaction.merchant}</p>
                    <p className="text-xs text-slate-500">
                      {txnParticipant?.display_name || txnParticipant?.username || transaction.auth_id} •
                      {" "}
                      {transaction.category || "Uncategorized"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {currency.format(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(transaction.occurred_on)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
