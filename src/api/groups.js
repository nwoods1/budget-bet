import { apiFetch } from "./client";

export function createGroup({ name, ownerId }) {
  return apiFetch("/groups", {
    method: "POST",
    body: { name, ownerId },
  });
}

export function listMyGroups(memberId) {
  const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  return apiFetch(`/groups${query}`);
}

export function addMemberByUsername({ groupId, username }) {
  return apiFetch(`/groups/${groupId}/members`, {
    method: "POST",
    body: { username },
  });
}

export function getGroup(groupId) {
  return apiFetch(`/groups/${groupId}`);
}
