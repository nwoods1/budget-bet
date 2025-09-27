import { apiFetch } from "./client";

export function createPlaidLinkToken(userId) {
  return apiFetch("/plaid/link-token", {
    method: "POST",
    body: { userId },
  });
}

export function exchangePlaidPublicToken({ userId, publicToken, institutionName }) {
  return apiFetch("/plaid/exchange", {
    method: "POST",
    body: { userId, publicToken, institutionName },
  });
}

export function fetchTransactions({ userId, startDate, endDate, cursor = null }) {
  const params = new URLSearchParams({
    userId,
    startDate,
    endDate,
  });
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/plaid/transactions?${params.toString()}`);
}
