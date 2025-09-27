import { request } from "./client";

export async function createBet(payload) {
  return request("/api/bets", {
    method: "POST",
    body: JSON.stringify({
      group_id: payload.groupId,
      created_by: payload.createdBy,
      title: payload.title,
      description: payload.description,
      budget_limit: Number(payload.budgetLimit),
      deadline: payload.deadline,
    }),
  });
}

export async function fetchBet(betId) {
  return request(`/api/bets/${betId}`);
}

export async function acceptBet(betId, authId) {
  return request(`/api/bets/${betId}/accept`, {
    method: "POST",
    body: JSON.stringify({ auth_id: authId }),
  });
}

export async function addTransaction(betId, transaction) {
  return request(`/api/bets/${betId}/transactions`, {
    method: "POST",
    body: JSON.stringify({
      auth_id: transaction.authId,
      amount: Number(transaction.amount),
      merchant: transaction.merchant,
      category: transaction.category || undefined,
      occurred_on: transaction.occurredOn,
    }),
  });
}

export async function finalizeBet(betId) {
  return request(`/api/bets/${betId}/finalize`, {
    method: "POST",
  });
}

export async function fetchDashboard(authId) {
  return request(`/api/dashboard/${authId}`);
}

export async function fetchPlaidTransactions(authId) {
  return request(`/api/plaid/transactions/${authId}`);
}
