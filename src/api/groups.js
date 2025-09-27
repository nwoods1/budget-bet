import { request } from "./client";

export async function createGroup({ name, ownerAuthId, memberUsernames = [] }) {
  return request("/api/groups", {
    method: "POST",
    body: JSON.stringify({
      name,
      owner_auth_id: ownerAuthId,
      member_usernames: memberUsernames,
    }),
  });
}

export async function fetchGroups(authId) {
  const params = new URLSearchParams({ auth_id: authId });
  return request(`/api/groups?${params.toString()}`);
}

export async function fetchGroup(groupId) {
  return request(`/api/groups/${groupId}`);
}

export async function addGroupMember(groupId, username) {
  return request(`/api/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function fetchGroupBets(groupId) {
  return request(`/api/groups/${groupId}/bets`);
}
