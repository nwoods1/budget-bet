import React, { useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase/firebase";
import {
  createUser as apiCreateUser,
  getUserByEmail,
  getUserByUsername,
} from "../../api/users";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function normaliseUsername(displayName, email, uid) {
  const baseFromEmail = email ? email.split("@")[0] : "";
  const raw = (displayName || baseFromEmail || `user-${uid?.slice(-6) || "000"}`).trim();
  let cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "");
  if (cleaned.length < 3) {
    cleaned = `${baseFromEmail || "user"}${uid ? `-${uid.slice(-4)}` : ""}`;
    cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, "");
  }
  if (cleaned.length < 3) {
    cleaned = `user-${uid || Math.random().toString(36).slice(-6)}`;
  }
  return cleaned.slice(0, 20);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const hydrateBackendUser = useCallback(async (user) => {
    if (!user) {
      setBackendUser(null);
      return null;
    }

    const email = user.email?.toLowerCase() || "";
    const desiredUsername = normaliseUsername(user.displayName, email, user.uid);

    async function lookupBackendUser() {
      if (desiredUsername) {
        try {
          return await getUserByUsername(desiredUsername.toLowerCase());
        } catch (err) {
          if (err?.status !== 404) throw err;
        }
      }
      if (email) {
        try {
          return await getUserByEmail(email);
        } catch (err) {
          if (err?.status !== 404) throw err;
        }
      }
      return null;
    }

    let backend = await lookupBackendUser();

    if (!backend) {
      try {
        backend = await apiCreateUser({
          email,
          username: desiredUsername,
          photoURL: user.photoURL || null,
          firebaseUid: user.uid,
        });
      } catch (err) {
        if (err?.status === 409 && email) {
          backend = await getUserByEmail(email);
        } else {
          throw err;
        }
      }
    }

    setBackendUser(backend);

    const baseUser = { ...user };
    baseUser.displayName = backend?.username || baseUser.displayName;
    baseUser.backendId = backend?.id || null;
    baseUser.backendUser = backend;
    return baseUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        const hydrated = await hydrateBackendUser(user);
        setCurrentUser(hydrated);
        setUserLoggedIn(!!hydrated);
      } catch (err) {
        console.error("Failed to sync user with backend", err);
        setCurrentUser(user ? { ...user } : null);
        setBackendUser(null);
        setUserLoggedIn(!!user);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [hydrateBackendUser]);

  const value = {
    currentUser,
    backendUser,
    userLoggedIn,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
