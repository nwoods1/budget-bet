import { useEffect, useState } from "react";
import { fetchPlaidTransactions } from "../api/bets";
import { updateUser } from "../api/users";
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

export default function Profile() {
  const { userLoggedIn } = useAuth();
  const { apiUser, loading, error, refresh } = useApiUser();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [formMessage, setFormMessage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    if (!apiUser) return;
    setDisplayName(apiUser.display_name || "");
    setUsername(apiUser.username || "");
    setPhotoUrl(apiUser.photo_url || "");
    setTransactionsLoading(true);
    fetchPlaidTransactions(apiUser.auth_id)
      .then((data) => setTransactions(data))
      .catch(() => setTransactions([]))
      .finally(() => setTransactionsLoading(false));
  }, [apiUser]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!apiUser) return;
    setFormMessage(null);
    setFormLoading(true);
    try {
      await updateUser(apiUser.auth_id, {
        display_name: displayName || undefined,
        username: username || undefined,
        photo_url: photoUrl || undefined,
      });
      await refresh();
      setFormMessage({ type: "success", text: "Profile updated" });
    } catch (err) {
      setFormMessage({ type: "error", text: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  if (!userLoggedIn) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to view your profile</h1>
        <p className="mt-2 text-slate-600">Log in to customize your avatar and track your spending history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 p-6 text-rose-700">
        Unable to load profile: {error.message}
      </div>
    );
  }

  if (!apiUser) {
    return null;
  }

  const totalTracked = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-500 text-3xl font-semibold text-white">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName || username || "Avatar"} className="h-full w-full object-cover" />
            ) : (
              (displayName || username || "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-slate-900">{displayName || username || "Budgeteer"}</h1>
            <p className="mt-2 text-sm text-slate-600">@{username || "pick-a-username"}</p>
            <p className="mt-4 text-sm text-slate-500">Joined via {apiUser.email}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-600">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="unique_handle"
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Profile photo URL</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {formMessage && (
            <p
              className={`text-sm ${
                formMessage.type === "error" ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {formMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={formLoading}
            className="inline-flex items-center rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {formLoading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Recent Plaid transactions</h2>
          <p className="text-sm text-slate-500">Total tracked: {currency.format(totalTracked)}</p>
        </div>
        {transactionsLoading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No transactions synced yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <li
                key={transaction._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{transaction.merchant}</p>
                  <p className="text-xs text-slate-500">{transaction.category || "Uncategorized"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {currency.format(transaction.amount)}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(transaction.occurred_on)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
