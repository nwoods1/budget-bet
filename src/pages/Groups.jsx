import { useEffect, useMemo, useState } from "react";

import "./Groups.css";
import GroupCard from "../components/groupCard/GroupCard";
import { getGroup, getUser, getUserForAvatar } from "../api";

export default function Groups() {
  const currentUserId = useMemo(
    () => process.env.REACT_APP_USER_ID ?? "demo-user",
    [],
  );
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cache = new Map();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const user = await getUser(currentUserId);

        const groupDetails = await Promise.all(
          (user.group_ids ?? []).map(async (groupId) => {
            const group = await getGroup(groupId);

            const members = await Promise.all(
              (group.user_ids ?? []).slice(0, 5).map(async (id) => {
                if (!cache.has(id)) {
                  cache.set(id, await getUserForAvatar(id));
                }
                const summary = cache.get(id);
                return {
                  id: summary._id,
                  name: summary.username ?? summary.email,
                  avatarUrl: summary.profile_url,
                };
              })
            );

            return {
              id: group._id,
              title: group.name,
              status: group.current_bet_id ? "active" : "completed",
              budget: 0,
              daysLeft: undefined,
              members,
            };
          })
        );

        setGroups(groupDetails);
      } catch (err) {
        setError(err.message ?? "Unable to load groups");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUserId]);

  return (
    <section className="groups-page">
      <div className="groups-head">
        <h2>My Groups</h2>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div className="groups-list">
        {groups.length === 0 && !loading && !error && (
          <p>You are not in any groups yet.</p>
        )}
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            title={g.title}
            status={g.status}
            budget={g.budget}
            daysLeft={g.daysLeft}
            members={g.members}
            currentUserId={currentUserId}
            ctaText={g.status === "active" ? "View Race" : "View"}
            onClick={() => console.log("Open group:", g.id)}
          />
        ))}
      </div>
    </section>
  );
}