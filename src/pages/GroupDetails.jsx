import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getGroup } from "../api/groups";
import AddMemberForm from "../components/AddMemberForm";

export default function GroupDetails() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const data = await getGroup(groupId);
      setGroup(data);
    } catch (err) {
      console.error("Unable to load group", err);
      setGroup(null);
      setError(err?.message || "Unable to load group");
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      refresh();
    }
  }, [groupId, refresh]);

  if (!group) {
    if (error) {
      return (
        <div style={{ padding: "2rem" }}>
          <h1>Group not available</h1>
          <p style={{ color: "#b91c1c" }}>{error}</p>
        </div>
      );
    }
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{group.name}</h1>

      <h3>Members</h3>
      <ul>
        {group.members.map(m => (
          <li key={m.userId}>{m.userId} ({m.role})</li>
        ))}
      </ul>

      {/* Add new members */}
      <AddMemberForm groupId={groupId} onAdded={refresh} />
    </div>
  );
}
