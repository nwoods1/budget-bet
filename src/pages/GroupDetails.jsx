import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addGroupMember, fetchGroup, fetchGroupBets } from "../api/groups";
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

export default function GroupDetails() {
  const { groupId } = useParams();
  const { userLoggedIn } = useAuth();
  const { apiUser, loading: userLoading } = useApiUser();
  const [group, setGroup] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [formMessage, setFormMessage] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchGroup(groupId), fetchGroupBets(groupId)])
      .then(([groupData, betData]) => {
        if (!active) return;
        setGroup(groupData);
        setBets(betData);
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
  }, [groupId]);

  const isMember = useMemo(() => {
    if (!apiUser || !group) return false;
    return group.members.some((member) => member.auth_id === apiUser.auth_id);
  }, [apiUser, group]);

  const ownerName = useMemo(() => {
    if (!group) return null;
    const owner = group.members.find((member) => member.auth_id === group.owner_auth_id);
    return owner?.display_name || owner?.username || owner?.auth_id;
  }, [group]);

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!username.trim()) return;
    setFormMessage(null);
    try {
      const updated = await addGroupMember(groupId, username.trim());
      setGroup(updated);
      setUsername("");
      setFormMessage({ type: "success", text: "Friend added to the group" });
    } catch (err) {
      setFormMessage({ type: "error", text: err.message });
    }
  };

  if (!userLoggedIn) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to view group details</h1>
        <p className="mt-2 text-slate-600">Log in to see who&apos;s participating and track your bets.</p>
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
        Unable to load this group: {error.message}
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="space-y-10">
      <header className="rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Group</p>
            <h1 className="text-3xl font-semibold text-slate-900">{group.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {group.members.length} member{group.members.length === 1 ? "" : "s"} • Managed by {ownerName}
            </p>
          </div>
          <Link
            to="/create-bet"
            className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow hover:bg-indigo-600"
          >
            Start a new bet
          </Link>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-8 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Members</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {group.members.map((member) => (
            <div
              key={member.auth_id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-lg font-semibold text-white">
                {(member.display_name || member.username || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {member.display_name || member.username || member.auth_id}
                </p>
                <p className="text-xs text-slate-500">{member.username ? `@${member.username}` : member.auth_id}</p>
              </div>
            </div>
          ))}
        </div>

        {isMember && (
          <form onSubmit={handleAddMember} className="mt-6 flex flex-wrap gap-3">
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Add a friend by username"
              className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Invite
            </button>
            {formMessage && (
              <span
                className={`text-sm font-semibold ${
                  formMessage.type === "error" ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formMessage.text}
              </span>
            )}
          </form>
        )}
      </section>

      <section className="rounded-2xl bg-white p-8 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Bets in this group</h2>
          <Link to="/create-bet" className="text-sm font-semibold text-indigo-600 hover:underline">
            Create bet
          </Link>
        </div>

        {bets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No bets yet. Start one to challenge your crew.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bets.map((bet) => (
              <Link
                to={`/bets/${bet._id}`}
                key={bet._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{bet.status}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{bet.title}</h3>
                    <p className="text-sm text-slate-500">Deadline {formatDate(bet.deadline)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total budget</p>
                    <p className="text-base font-semibold text-slate-900">{currency.format(bet.budget_limit)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bet.participants.map((participant) => (
                    <span
                      key={participant.auth_id}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        participant.accepted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                        {(participant.display_name || participant.username || "?").slice(0, 1).toUpperCase()}
                      </span>
                      {participant.display_name || participant.username || participant.auth_id}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
