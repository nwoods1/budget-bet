import { useState } from "react";
import { addMemberByUsername } from "../api/groups";

export default function AddMemberForm({ groupId, onAdded }) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      const updatedGroup = await addMemberByUsername({ groupId, username });
      setUsername("");
      onAdded?.(updatedGroup); // call parent if you want to refresh members list
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 16 }}>
      <input
        placeholder="Add member by username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={busy}
      />
      <button type="submit" disabled={busy}>
        {busy ? "Adding..." : "Add Member"}
      </button>
      {err && <div style={{ color: "red" }}>{err}</div>}
    </form>
  );
}
