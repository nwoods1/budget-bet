// CRA uses `REACT_APP_*` for env vars; fall back to localhost for local dev
const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getUser(userId: string) {
  return j<UserOut>(await fetch(`${BASE_URL}/users/${userId}`));
}

export async function getGroup(groupId: string) {
  return j<GroupOut>(await fetch(`${BASE_URL}/groups/${groupId}`));
}

export async function listActiveBetsByGroup(groupId: string) {
  const url = new URL(`${BASE_URL}/bets`);
  url.searchParams.set("group_id", groupId);
  url.searchParams.set("status", "active");
  return j<BetOut[]>(await fetch(url.toString()));
}

export async function getUserForAvatar(userId: string) {
  return j<UserOut>(await fetch(`${BASE_URL}/users/${userId}`));
}

/* Types (trimmed to what you need) */
export type UserOut = {
  _id: string;
  username: string;
  email: string;
  profile_url: string;
  group_ids: string[];
  average_spending: number;
};

export type GroupOut = {
  _id: string;
  name: string;
  description?: string | null;
  user_ids: string[];
  current_bet_id?: string | null;
};

export type BetProgress = {
  user_id: string;
  progress?: number;
  last_updated?: string;
};

export type BetOut = {
  _id: string;
  group_id: string;
  title: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  status: "planned" | "active" | "finished" | "cancelled";
  user_progress: BetProgress[];
  meta?: Record<string, string>;
};