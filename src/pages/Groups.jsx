import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

import { createGroup, addMemberByUsername } from "../api/groups";
import { searchUsers } from "../api/users";

export default function Groups() {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // must include backendId (Mongo _id string)

  // form state
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState([]); // array of usernames (string)

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // debounce username search
  useEffect(() => {
    let t;
    async function run() {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await searchUsers(query.trim());
        setSuggestions(res); // [{ id, username, usernameLower }]
      } catch {
        setSuggestions([]);
      }
    }
    t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [query]);

  function addUsername(uname) {
    if (!selected.includes(uname)) setSelected((s) => [...s, uname]);
  }
  function removeUsername(uname) {
    setSelected((s) => s.filter((u) => u !== uname));
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!currentUser?.backendId) {
      setErr("Missing current user backend id.");
      return;
    }

    try {
      setBusy(true);
      setErr("");

      // 1) Create the group with current user as owner
      const group = await createGroup({
        name: name.trim(),
        ownerId: currentUser.backendId,
      });

      // 2) Add selected usernames as members (owner is already a member)
      for (const uname of selected) {
        // avoid double-adding yourself if you typed your own username
        await addMemberByUsername({ groupId: group.id, username: uname });
      }

      // 3) Go to group details
      navigate(`/groups/${group.id}`);
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1>Create Group</h1>

      <form onSubmit={submit}>
        {/* Group name */}
        <label style={{ display: "block", marginTop: 12 }}>Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Roomies"
          disabled={busy}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />

        {/* Username search */}
        <label style={{ display: "block", marginTop: 16 }}>
          Add members by username
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search username…"
          disabled={busy}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />

        {/* Suggestions list */}
        {!!suggestions.length && (
          <ul
            style={{
              border: "1px solid #eee",
              marginTop: 6,
              maxHeight: 160,
              overflow: "auto",
              borderRadius: 6,
            }}
          >
            {suggestions.map((u) => (
              <li
                key={u.id}
                onClick={() => addUsername(u.username)}
                style={{
                  padding: "6px 8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f3f3",
                }}
              >
                @{u.username}
              </li>
            ))}
          </ul>
        )}

        {/* Selected chips */}
        {!!selected.length && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            {selected.map((uname) => (
              <span
                key={uname}
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 8px",
                  borderRadius: 999,
                }}
              >
                @{uname}{" "}
                <button
                  type="button"
                  onClick={() => removeUsername(uname)}
                  style={{ marginLeft: 6 }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {err && (
          <div style={{ color: "red", marginTop: 12 }}>{String(err)}</div>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}
