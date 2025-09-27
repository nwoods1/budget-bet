import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/authContext";
import { fetchUser, syncUserProfile } from "../api/users";

export function useApiUser() {
  const { currentUser } = useAuth();
  const [apiUser, setApiUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    if (!currentUser) {
      setApiUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      try {
        const existing = await fetchUser(currentUser.uid);
        setApiUser(existing);
      } catch (fetchError) {
        const synced = await syncUserProfile({
          authId: currentUser.uid,
          email: currentUser.email,
          username: currentUser.displayName,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        setApiUser(synced);
      }
    } catch (err) {
      setError(err);
      setApiUser(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await loadUser();
    })();
    return () => {
      active = false;
    };
  }, [loadUser]);

  return { apiUser, loading, error, refresh: loadUser };
}
