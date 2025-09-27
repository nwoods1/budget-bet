import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createGroup, fetchGroups } from "../api/groups";
import { useAuth } from "../contexts/authContext";
import { useApiUser } from "../hooks/useApiUser";

export default function Groups() {
  const { userLoggedIn } = useAuth();
  const { apiUser, loading: userLoading } = useApiUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [formMessage, setFormMessage] = useState(null);

  useEffect(() => {
    if (!apiUser) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchGroups(apiUser.auth_id)
      .then((data) => {
        if (!active) return;
        setGroups(data);
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

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!apiUser) return;
    setFormMessage(null);
    try {
      const additionalUsernames = usernames
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      await createGroup({
        name,
        ownerAuthId: apiUser.auth_id,
        memberUsernames: additionalUsernames,
      });
      setName("");
      setUsernames("");
      const refreshed = await fetchGroups(apiUser.auth_id);
      setGroups(refreshed);
      setFormMessage({ type: "success", text: "Group created successfully" });
    } catch (err) {
      setFormMessage({ type: "error", text: err.message });
    }
  };

  if (!userLoggedIn) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to view your groups</h1>
        <p className="mt-2 text-slate-600">You&apos;ll be able to create a squad and invite friends once you log in.</p>
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

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-8 shadow">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your budgeting crews</h1>
          <p className="mt-2 text-slate-600">
            Create a group, invite your friends by username, and start a savings challenge together.
          </p>
        </div>

        <form onSubmit={handleCreateGroup} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="sm:col-span-1">
            <label className="text-sm font-semibold text-slate-600">Group name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekend Warriors"
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-semibold text-slate-600">Invite by username</label>
            <input
              type="text"
              value={usernames}
              onChange={(event) => setUsernames(event.target.value)}
              placeholder="comma,separated,handles"
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Use the usernames your friends picked when signing up.</p>
          </div>
          <div className="self-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow hover:bg-indigo-600"
            >
              Create group
            </button>
          </div>
        </form>
        {formMessage && (
          <p
            className={`text-sm ${
              formMessage.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {formMessage.text}
          </p>
        )}
      </header>

      {error ? (
        <div className="rounded-xl bg-rose-50 p-6 text-rose-700">
          Unable to load groups: {error.message}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No groups yet. Use the form above to create your first one!
            </div>
          ) : (
            groups.map((group) => (
              <div key={group._id} className="flex h-full flex-col justify-between rounded-2xl bg-white p-6 shadow">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{group.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {group.members.length} member{group.members.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.members.map((member) => (
                      <span
                        key={member.auth_id}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white">
                          {(member.display_name || member.username || "?").slice(0, 1).toUpperCase()}
                        </span>
                        {member.display_name || member.username || member.auth_id}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/groups/${group._id}`}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600"
                >
                  View group →
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
