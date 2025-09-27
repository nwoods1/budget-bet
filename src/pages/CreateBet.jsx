import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBet } from "../api/bets";
import { fetchGroups } from "../api/groups";
import { useAuth } from "../contexts/authContext";
import { useApiUser } from "../hooks/useApiUser";

export default function CreateBet() {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();
  const { apiUser, loading: userLoading } = useApiUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("100");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!apiUser) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchGroups(apiUser.auth_id)
      .then((data) => {
        if (!active) return;
        setGroups(data);
        if (data.length > 0) {
          setGroupId((prev) => prev || data[0]._id);
        }
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

  const eligibleGroups = useMemo(() => groups, [groups]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!apiUser) return;
    setFormError(null);
    setFormLoading(true);
    try {
      const payload = await createBet({
        groupId,
        createdBy: apiUser.auth_id,
        title,
        description,
        budgetLimit,
        deadline,
      });
      navigate(`/bets/${payload._id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (!userLoggedIn) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to create a bet</h1>
        <p className="mt-2 text-slate-600">You&apos;ll need to log in before you can challenge your friends.</p>
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
        Unable to load groups: {error.message}
      </div>
    );
  }

  if (eligibleGroups.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Create a group first</h1>
        <p className="mt-2 text-slate-600">
          You need to be part of a group before you can propose a bet. Head over to the groups page to start
          one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow">
      <h1 className="text-2xl font-semibold text-slate-900">Propose a budgeting bet</h1>
      <p className="mt-2 text-slate-600">Pick your group, set a budget, and challenge everyone to save the most.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-600">Group</label>
          <select
            required
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          >
            {eligibleGroups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-600">Bet title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="February frugal-off"
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-600">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Share the rules, prize, or any special conditions."
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-600">Budget limit (per person)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={budgetLimit}
              onChange={(event) => setBudgetLimit(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Deadline</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}

        <button
          type="submit"
          disabled={formLoading}
          className="inline-flex items-center rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {formLoading ? "Creating bet..." : "Send bet for approval"}
        </button>
      </form>
    </div>
  );
}
