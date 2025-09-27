// Safe BASE for CRA (and also works if you later move to Vite)
const BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";

export async function createGroup({ name, ownerId }) {
  const res = await fetch(`${BASE}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ownerId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listMyGroups(memberId) {
  const url = memberId ? `${BASE}/groups?memberId=${memberId}` : `${BASE}/groups`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addMemberByUsername({ groupId, username }) {
  const res = await fetch(`${BASE}/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
