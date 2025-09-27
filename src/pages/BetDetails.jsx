import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getBet } from "../api/bets";
import { getGroup } from "../api/groups";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

export default function BetDetails() {
  const { betId } = useParams();
  const [bet, setBet] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!betId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const betData = await getBet(betId);
        if (cancelled) return;
        setBet(betData);

        const groupData = await getGroup(betData.groupId);
        if (cancelled) return;
        setGroup(groupData);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load bet");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [betId]);

  const participants = useMemo(() => {
    if (!bet || !group) return [];
    const memberMap = new Map(group.members.map((member) => [member.userId, member]));
    return (bet.participantIds || []).map((id) => {
      const member = memberMap.get(id) || {};
      return {
        id,
        role: member.role || "member",
        joinedAt: member.joinedAt,
      };
    });
  }, [bet, group]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading bet...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "#B91C1C" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Could not load bet</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!bet) {
    return <div style={{ padding: "2rem" }}>Bet not found.</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 720 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>{bet.title}</h1>
      <p style={{ marginTop: 4, color: "#4b5563" }}>{group ? `Group: ${group.name}` : ""}</p>

      <section style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <div>
          <span style={{ fontWeight: 600 }}>Total budget:</span> {formatCurrency(bet.totalBudget)}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>Status:</span> {bet.status}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>Start:</span> {formatDate(bet.startDate)}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>End:</span> {formatDate(bet.endDate)}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Participants</h2>
        {!participants.length && <p style={{ color: "#6b7280" }}>No participants on this bet yet.</p>}
        {!!participants.length && (
          <ul style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {participants.map((participant) => (
              <li
                key={participant.id}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              >
                <div style={{ fontWeight: 600 }}>User ID: {participant.id}</div>
                <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Role: {participant.role}</div>
                {participant.joinedAt && (
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    Joined: {formatDate(participant.joinedAt)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
