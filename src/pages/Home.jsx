import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard } from "../api/bets";
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

export default function Home() {
  const { userLoggedIn } = useAuth();
  const { apiUser, loading: userLoading, error: userError } = useApiUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiUser) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetchDashboard(apiUser.auth_id)
      .then((data) => {
        if (!active) return;
        setDashboard(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiUser]);

  const activeBets = useMemo(() => dashboard?.active_bets || [], [dashboard]);
  const completedBets = useMemo(() => dashboard?.completed_bets || [], [dashboard]);
  const groups = useMemo(() => dashboard?.groups || [], [dashboard]);

  if (!userLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to Budget Bet</h1>
        <p className="mt-4 text-slate-600">
          Challenge your friends to budget better. Create groups, start wagers, and track everyone’s
          spending in real-time.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-600"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-indigo-500 px-6 py-3 font-semibold text-indigo-500 hover:bg-indigo-50"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (userLoading || loading) {
    return (
      <div className="flex w-full justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        Unable to load your profile: {userError.message}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        Unable to load your dashboard: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">
          Hey {dashboard?.user?.display_name || apiUser?.display_name || "there"} 👋
        </h1>
        <p className="mt-2 text-slate-600">
          Here’s what’s happening across your budgeting bets this week.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/create-bet"
            className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow hover:bg-indigo-600"
          >
            Create a new bet
          </Link>
          <Link
            to="/groups"
            className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Manage groups
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Active bets</h2>
          {activeBets.length > 0 && (
            <span className="text-sm text-slate-500">{activeBets.length} currently running</span>
          )}
        </div>
        {activeBets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No active bets yet. Start one with your friends to kick off a budgeting battle!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {activeBets.map((bet) => {
              const participant = bet.participants.find((p) => p.auth_id === apiUser?.auth_id);
              const spent = participant?.spending || 0;
              const progress = Math.min(100, Math.round((spent / bet.budget_limit) * 100));
              return (
                <Link
                  to={`/bets/${bet._id}`}
                  key={bet._id}
                  className="group rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                        {bet.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">Deadline: {formatDate(bet.deadline)}</p>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase text-indigo-600">
                      {bet.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>You&apos;ve spent {currency.format(spent)}</span>
                      <span>Budget {currency.format(bet.budget_limit)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${progress > 80 ? "bg-rose-500" : "bg-indigo-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your groups</h2>
          <Link to="/groups" className="text-sm font-semibold text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Create a group to invite your friends and start a challenge.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.slice(0, 4).map((group) => (
              <Link
                to={`/groups/${group._id}`}
                key={group._id}
                className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {group.members.length} member{group.members.length === 1 ? "" : "s"}
                </p>
                <div className="mt-4 flex -space-x-2">
                  {group.members.slice(0, 5).map((member) => (
                    <span
                      key={member.auth_id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-sm font-semibold text-white"
                      title={member.display_name || member.username || "Player"}
                    >
                      {(member.display_name || member.username || "?")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Recent winners</h2>
        {completedBets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No completed bets yet. Keep saving!
          </div>
        ) : (
          <div className="space-y-4">
            {completedBets.slice(0, 3).map((bet) => {
              const winner = bet.participants.find((p) => p.auth_id === bet.winner_auth_id);
              const pot = bet.participants.reduce((acc, participant) => acc + (participant.spending || 0), 0);
              return (
                <div
                  key={bet._id}
                  className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-400">{formatDate(bet.completed_at)}</p>
                      <h3 className="text-lg font-semibold text-slate-900">{bet.title}</h3>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
                      Winner: {winner?.display_name || winner?.username || "Unknown"}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">Total tracked spend: {currency.format(pot)}</p>
                  <Link
                    to={`/bets/${bet._id}`}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    View bet summary →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
