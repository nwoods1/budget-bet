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

export function listUsers() {
  return apiFetch("/users");
}
