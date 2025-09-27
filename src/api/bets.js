import { apiFetch } from "./client";

export function createBet({
  groupId,
  createdBy,
  title,
  totalBudget,
  startDate,
  endDate,
  participantIds = [],
  status = "planned",
  meta = {},
}) {
  return apiFetch("/bets", {
    method: "POST",
    body: {
      groupId,
      createdBy,
      title,
      totalBudget,
      startDate,
      endDate,
      participantIds,
      status,
      meta,
    },
  });
}

export function getBet(betId) {
  return apiFetch(`/bets/${betId}`);
}

export function listBets({ groupId, status } = {}) {
  const params = new URLSearchParams();
  if (groupId) params.set("groupId", groupId);
  if (status) params.set("status", status);
  const query = params.toString();
  return apiFetch(`/bets${query ? `?${query}` : ""}`);
}
