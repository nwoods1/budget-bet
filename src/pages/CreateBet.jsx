import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createBet } from "../api/bets";
import { listMyGroups } from "../api/groups";
import { useAuth } from "../contexts/authContext";

function toIso(dateString, endOfDay = false) {
  if (!dateString) return null;
  const suffix = endOfDay ? "T23:59:59" : "T00:00:00";
  const date = new Date(`${dateString}${suffix}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function CreateBet() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const backendId = currentUser?.backendId;

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState("");
  const [budget, setBudget] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!backendId) return;
    async function load() {
      setLoadingGroups(true);
      try {
        const data = await listMyGroups(backendId);
        setGroups(data);
        if (data.length) {
          setGroupId((prev) => prev || data[0].id);
        }
      } catch (err) {
        console.error("Failed to load groups", err);
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    }
    load();
  }, [backendId]);

  const canSubmit = useMemo(() => {
    return (
      !!backendId &&
      !!groupId &&
      !!title.trim() &&
      Number(budget) > 0 &&
      !!startDate &&
      !!endDate &&
      !busy
    );
  }, [backendId, groupId, title, budget, startDate, endDate, busy]);

  async function submit(e) {
    e.preventDefault();
    if (!backendId) {
      setError("You need to be signed in with a synced account before creating a bet.");
      return;
    }
    if (!groupId) {
      setError("Select a group to associate with this bet.");
      return;
    }
    const startIso = toIso(startDate);
    const endIso = toIso(endDate, true);
    if (!startIso || !endIso) {
      setError("Please choose valid start and end dates.");
      return;
    }
    if (new Date(startIso) >= new Date(endIso)) {
      setError("The end date must be after the start date.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const bet = await createBet({
        groupId,
        createdBy: backendId,
        title: title.trim(),
        totalBudget: Number(budget),
        startDate: startIso,
        endDate: endIso,
      });
      navigate(`/bets/${bet.id}`);
    } catch (err) {
      setError(err?.message || "Failed to create bet.");
      setBusy(false);
    }
  }

  const groupOptions = groups.map((group) => (
    <option key={group.id} value={group.id}>
      {group.name}
    </option>
  ));

  return (
    <div style={{ padding: "2rem", maxWidth: 640 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>Create a new bet</h1>
      <p style={{ marginTop: 8, color: "#4b5563" }}>
        Choose one of your groups and define the shared budget challenge.
      </p>

      {!backendId && (
        <div style={{ marginTop: 16, padding: 12, background: "#FEF2F2", borderRadius: 8, color: "#B91C1C" }}>
          Sign in to connect your account before creating a bet.
        </div>
      )}

      <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Group</span>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={!backendId || loadingGroups || busy || !groups.length}
            style={{ padding: 8, borderRadius: 6 }}
          >
            {!groups.length && <option value="">{loadingGroups ? "Loading groups..." : "No groups yet"}</option>}
            {groupOptions}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Bet title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. $500 groceries challenge"
            disabled={busy}
            style={{ padding: 8, borderRadius: 6 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Total budget ($)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={busy}
            style={{ padding: 8, borderRadius: 6 }}
          />
        </label>

        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ flex: 1, display: "grid", gap: 6 }}>
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={busy}
              style={{ padding: 8, borderRadius: 6 }}
            />
          </label>
          <label style={{ flex: 1, display: "grid", gap: 6 }}>
            <span>End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={busy}
              style={{ padding: 8, borderRadius: 6 }}
            />
          </label>
        </div>

        {error && <div style={{ color: "#B91C1C" }}>{error}</div>}

        <div>
          <button type="submit" disabled={!canSubmit} style={{ padding: "10px 18px", borderRadius: 8 }}>
            {busy ? "Creating bet..." : "Create bet"}
          </button>
        </div>
      </form>
    </div>
  );
}
