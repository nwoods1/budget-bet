import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getGroup, getUserForAvatar, listActiveBetsByGroup } from "../api";
import ActiveBet from "../components/activeBet/ActiveBet";

export default function GroupDetails() {
  const { groupId } = useParams();
  const userId = useMemo(
    () => process.env.REACT_APP_USER_ID ?? "demo-user",
    [],
  );
  const [group, setGroup] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) return;
    const cache = new Map();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const groupDetails = await getGroup(groupId);
        setGroup(groupDetails);

        const active = await listActiveBetsByGroup(groupId);

        const enriched = await Promise.all(
          active.map(async (bet) => {
            const participants = await Promise.all(
              (bet.user_progress ?? []).map(async (entry) => {
                if (!cache.has(entry.user_id)) {
                  cache.set(entry.user_id, await getUserForAvatar(entry.user_id));
                }
                const summary = cache.get(entry.user_id);
                return {
                  id: summary._id,
                  name: summary.username ?? summary.email,
                  avatarUrl: summary.profile_url,
                  progress: Math.min(100, Math.max(0, entry.progress ?? 0)),
                };
              })
            );

            const now = Date.now();
            const end = bet.end_date ? new Date(bet.end_date).getTime() : now;
            const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

            return {
              id: bet._id,
              title: bet.title,
              daysLeft,
              participants,
            };
          })
        );

        setBets(enriched);
      } catch (err) {
        setError(err.message ?? "Unable to load group");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [groupId]);

  if (!groupId) {
    return <p className="p-4">No group selected.</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      {loading && <p>Loading group…</p>}
      {error && <p className="text-red-500">{error}</p>}

      {group && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Logged in as {userId}</p>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && <p className="text-gray-700">{group.description}</p>}
          <p className="text-gray-600">Members: {group.user_ids?.length ?? 0}</p>
        </div>
      )}

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Active Bets</h2>
        {bets.length === 0 && !loading && !error && <p>No active bets for this group.</p>}
        {bets.map((bet) => (
          <ActiveBet
            key={bet.id}
            title={bet.title}
            daysLeft={bet.daysLeft}
            participants={bet.participants}
          />
        ))}
      </section>
    </div>
  );
}
