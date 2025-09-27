import { apiFetch } from "./client";

export function searchUsers(q) {
  if (!q) return Promise.resolve([]);
  return apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
}

export function createUser({ email, username, photoURL = null, firebaseUid = null }) {
  return apiFetch("/users", {
    method: "POST",
    body: { email, username, photoURL, firebaseUid },
  });
}

export function getUserByUsername(username) {
  return apiFetch(`/users/by-username/${encodeURIComponent(username)}`);
}

export function getUserByEmail(email) {
  return apiFetch(`/users/by-email/${encodeURIComponent(email)}`);
}



export async function listUsers() {
  const users = await apiFetch("/users");
  return Array.isArray(users)
    ? users
        .slice()
        .sort((a, b) => a.username.localeCompare(b.username))
    : [];
}
