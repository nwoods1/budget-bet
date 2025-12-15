import { useEffect, useMemo, useState } from "react";

import "./Home.css";
import Button from "../components/button/Button";
import ActiveBet from "../components/activeBet/ActiveBet";
import { getUser, listActiveBetsByGroup, getUserForAvatar } from "../api";

function useUserId() {
  return useMemo(
    () => process.env.REACT_APP_USER_ID ?? "demo-user",
    [],
  );
}

export default function Home() {
  const userId = useUserId();
  const [activeBets, setActiveBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cache = new Map();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const user = await getUser(userId);
        const primaryGroupId = user.group_ids?.[0];
        if (!primaryGroupId) {
          setActiveBets([]);
          return;
        }

        const bets = await listActiveBetsByGroup(primaryGroupId);

        const enriched = await Promise.all(
          bets.map(async (bet) => {
            const participants = await Promise.all(
              (bet.user_progress ?? []).map(async (entry) => {
                if (!cache.has(entry.user_id)) {
                  cache.set(entry.user_id, await getUserForAvatar(entry.user_id));
                }

                const participant = cache.get(entry.user_id);
                return {
                  id: participant._id,
                  name: participant.username ?? participant.email,
                  avatarUrl: participant.profile_url,
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

        setActiveBets(enriched);
      } catch (err) {
        setError(err.message ?? "Unable to load bets");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero__overlay">
          <h1 className="hero__title">
            <span className="thin">Challenge</span>{" "}
            <span className="accent1">Your</span>{" "}
            <span className="accent2">Friends</span>
            <br />
            <span className="bold">Race to Your Goals</span>
          </h1>

          <p className="hero__subtitle">
            Create group challenges, vote on ideas, and track your progress in real-time.
            Turn savings and spending goals into exciting competitions.
          </p>

          <div className="hero__actions">
            <Button />
          </div>
        </div>
      </section>

      {/* ACTIVE BETS SECTION (owned by Home) */}
      <section className="active-bets">
        <div className="active-bets__inner">
          <div className="active-bets__head">
            <h2>Active Bets</h2>
            {loading && <span className="text-sm text-gray-500">Loading…</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>

          <div className="active-bets__list">
            {activeBets.length === 0 && !loading && !error && (
              <p>No active bets yet. Join a group to get started.</p>
            )}
            {activeBets.map((bet) => (
              <ActiveBet
                key={bet.id}
                title={bet.title}
                daysLeft={bet.daysLeft}
                participants={bet.participants}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}