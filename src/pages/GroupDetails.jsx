import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listMyGroups } from "../api/groups";
import AddMemberForm from "../components/AddMemberForm";

export default function GroupDetails() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);

  async function refresh() {
    // simple query to get the group again
    const groups = await listMyGroups(); // or create a getGroupById API helper
    setGroup(groups.find(g => g.id === groupId));
  }

  useEffect(() => { refresh(); }, [groupId]);

  if (!group) return <div>Loading...</div>;

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
