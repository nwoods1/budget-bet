import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../contexts/authContext";
import {
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  fetchTransactions,
} from "../api/plaid";

function usePlaidLink(token, { onSuccess, onExit, onError }) {
  const handlerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      handlerRef.current?.destroy?.();
      handlerRef.current = null;
      setReady(false);
      return;
    }

    let cancelled = false;

    function init() {
      if (!window.Plaid || cancelled) return;
      const instance = window.Plaid.create({
        token,
        onSuccess,
        onExit,
      });
      handlerRef.current = instance;
      if (!cancelled) {
        setReady(true);
      }
    }

    if (window.Plaid && window.Plaid.create) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.async = true;
      script.onload = init;
      script.onerror = () => {
        if (!cancelled) {
          onError?.(new Error("Failed to load Plaid Link"));
          setReady(false);
        }
      };
      document.body.appendChild(script);

      return () => {
        cancelled = true;
        handlerRef.current?.destroy?.();
        handlerRef.current = null;
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        setReady(false);
      };
    }

    return () => {
      cancelled = true;
      handlerRef.current?.destroy?.();
      handlerRef.current = null;
      setReady(false);
    };
  }, [token, onSuccess, onExit, onError]);

  const open = useCallback(() => {
    handlerRef.current?.open();
  }, []);

  return { open, ready };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);
}

export default function Profile() {
  const { currentUser, backendUser } = useAuth();
  const backendId = currentUser?.backendId;

  const [linkToken, setLinkToken] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [plaidError, setPlaidError] = useState("");

  const loadTransactions = useCallback(async () => {
    if (!backendId) return;
    setTransactionsLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const response = await fetchTransactions({
        userId: backendId,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });
      setTransactions(response.transactions || []);
    } catch (err) {
      setTransactions([]);
      setPlaidError(err?.message || "Could not load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  }, [backendId]);

  useEffect(() => {
    if (!backendId) return;
    loadTransactions();
  }, [backendId, loadTransactions]);

  const fetchLinkToken = useCallback(async () => {
    if (!backendId) return;
    setLinkLoading(true);
    try {
      const response = await createPlaidLinkToken(backendId);
      setLinkToken(response.linkToken);
      setPlaidError("");
    } catch (err) {
      setPlaidError(err?.message || "Unable to create link token");
    } finally {
      setLinkLoading(false);
    }
  }, [backendId]);

  useEffect(() => {
    if (!backendId) return;
    fetchLinkToken();
  }, [backendId, fetchLinkToken]);

  const handleLinkSuccess = useCallback(
    async (publicToken, metadata) => {
      if (!backendId) return;
      setPlaidError("");
      try {
        await exchangePlaidPublicToken({
          userId: backendId,
          publicToken,
          institutionName: metadata?.institution?.name || null,
        });
        await loadTransactions();
        await fetchLinkToken();
      } catch (err) {
        setPlaidError(err?.message || "Unable to link account");
      }
    },
    [backendId, loadTransactions, fetchLinkToken]
  );

  const handleLinkExit = useCallback((err) => {
    if (err) {
      setPlaidError(err.display_message || err.error_message || err.message);
    }
  }, []);

  const handleLinkError = useCallback((err) => {
    setPlaidError(err?.message || "Unable to initialise Plaid");
  }, []);

  const { open, ready } = usePlaidLink(linkToken, {
    onSuccess: handleLinkSuccess,
    onExit: handleLinkExit,
    onError: handleLinkError,
  });

  const hasTransactions = useMemo(() => transactions && transactions.length > 0, [transactions]);

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>Profile</h1>
      {backendUser && (
        <p style={{ marginTop: 8, color: "#4b5563" }}>
          Signed in as <strong>@{backendUser.username}</strong>
        </p>
      )}

      <section style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Bank connections</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={open}
            disabled={!backendId || linkLoading || !ready}
            style={{ padding: "10px 18px", borderRadius: 8 }}
          >
            {linkLoading ? "Preparing Plaid..." : "Connect bank account"}
          </button>
          <button
            onClick={fetchLinkToken}
            disabled={!backendId || linkLoading}
            style={{ padding: "10px 18px", borderRadius: 8 }}
          >
            Refresh link token
          </button>
        </div>
        {plaidError && <div style={{ color: "#B91C1C" }}>{plaidError}</div>}
      </section>

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>Recent transactions</h2>
          <button onClick={loadTransactions} disabled={!backendId || transactionsLoading}>
            {transactionsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {!hasTransactions && !transactionsLoading && (
          <p style={{ color: "#6b7280", marginTop: 12 }}>
            Connect a bank account through Plaid to start tracking your spending.
          </p>
        )}
        {transactionsLoading && <p style={{ marginTop: 12 }}>Loading transactions…</p>}
        {hasTransactions && (
          <ul style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {transactions.map((txn) => {
              const key = txn.transaction_id || `${txn.account_id}-${txn.date}-${txn.name}`;
              return (
              <li
                key={key}
                style={{
                  padding: "12px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>{txn.merchant_name || txn.name}</span>
                  <span>{formatCurrency(txn.amount)}</span>
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>
                  {txn.date}
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
