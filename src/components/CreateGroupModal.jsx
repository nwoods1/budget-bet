import { useEffect, useMemo, useState } from "react";
import { createGroup } from "../api/groups";
import { searchUsers } from "../api/users";
import { addMemberByUsername } from "../api/groups";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

export default function CreateGroupModal({ open, onClose }) {
  const { currentUser } = useAuth(); // must expose backendId (Mongo _id) in your context
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // usernames (string)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // debounce search
  useEffect(() => {
    if (!open) return;
    if (!query) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await searchUsers(query);
        setResults(r);
      } catch (e) {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  function addUsername(uname) {
    if (!selected.includes(uname)) setSelected([...selected, uname]);
  }
  function removeUsername(uname) {
    setSelected(selected.filter(u => u !== uname));
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setBusy(true);
      setErr("");

      const ownerId = currentUser?.backendId;  // Ensure you set this when creating the backend user
      const group = await createGroup({ name: name.trim(), ownerId });

      // Add selected usernames as members (owner already included)
      for (const uname of selected) {
        // skip if user typed their own username
        await addMemberByUsername({ groupId: group.id, username: uname });
      }

      onClose?.();
      navigate(`/groups/${group.id}`);
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",display:"grid",placeItems:"center",zIndex:50}}>
      <div style={{background:"#fff",padding:20,borderRadius:12,width:420,maxWidth:"90vw"}}>
        <h2>Create Group</h2>

        <form onSubmit={submit}>
          <label style={{display:"block",marginTop:12}}>Group name</label>
          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="e.g. Roomies"
            disabled={busy}
            style={{width:"100%",padding:8,marginTop:6}}
          />

          <label style={{display:"block",marginTop:16}}>Add members by username</label>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="search username..."
            disabled={busy}
            style={{width:"100%",padding:8,marginTop:6}}
          />

          {/* suggestions */}
          {!!results.length && (
            <ul style={{border:"1px solid #eee",marginTop:6,maxHeight:150,overflow:"auto"}}>
              {results.map(r => (
                <li
                  key={r.id}
                  onClick={()=>addUsername(r.username)}
                  style={{padding:"6px 8px",cursor:"pointer"}}
                >
                  @{r.username}
                </li>
              ))}
            </ul>
          )}

          {/* selected chips */}
          {!!selected.length && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
              {selected.map(u => (
                <span key={u} style={{border:"1px solid #ddd",padding:"4px 8px",borderRadius:999}}>
                  @{u} <button type="button" onClick={()=>removeUsername(u)} style={{marginLeft:6}}>x</button>
                </span>
              ))}
            </div>
          )}

          {err && <div style={{color:"red",marginTop:10}}>{err}</div>}

          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
            <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create group"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
