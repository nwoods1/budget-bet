import { request } from "./client";

export async function syncUserProfile({
  authId,
  email,
  username,
  displayName,
  photoURL,
}) {
  if (!authId || !email) {
    throw new Error("authId and email are required to sync user profile");
  }

  const payload = {
    auth_id: authId,
    email,
    username: username || undefined,
    display_name: displayName || undefined,
    photo_url: photoURL || undefined,
  };

  return request("/api/users/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchUser(authId) {
  return request(`/api/users/${authId}`);
}

export async function updateUser(authId, updates) {
  return request(`/api/users/${authId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function searchUsers(query) {
  const params = new URLSearchParams({ query });
  return request(`/api/users/search?${params.toString()}`);
}
