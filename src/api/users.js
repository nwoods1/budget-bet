const BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";

export async function searchUsers(q) {
  if (!q) return [];
  const res = await fetch(`${BASE}/users/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // [{ id, username, usernameLower }]
}


export async function createUser({ email, username, photoURL = null }) {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, photoURL }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserByUsername(username) {
  const res = await fetch(`${BASE}/users/by-username/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listUsers() {
  const res = await fetch(`${BASE}/users`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
