// A single bet card (no page section wrapper, no H2).
import "./ActiveBet.css";

/**
 * Props:
 * - title: string
 * - daysLeft: number|string
 * - participants: [{ id, name, avatarUrl, baseline, current, progress }]
 *
 * Meaning:
 *   baseline = expected spend in the window
 *   current  = actual spend so far
 *   delta    = baseline - current  (positive = saving more; negative = overspending)
 */
export default function ActiveBet({ title, daysLeft, participants = [] }) {
  const data = participants.length
    ? participants
    : [
        { id: "u1", name: "Sarah Kim", avatarUrl: "https://i.pravatar.cc/64?img=47", progress: 82 },
        { id: "u2", name: "Mike Torres", avatarUrl: "https://i.pravatar.cc/64?img=12", progress: 64 },
        { id: "u3", name: "Emma Wilson", avatarUrl: "https://i.pravatar.cc/64?img=5",  progress: 51 },
      ];

  const deltas = data.map(d => (d.baseline ?? 0) - (d.current ?? 0));
  const maxAbs = Math.max(1, ...deltas.map(Math.abs)); // avoid /0
  const toPos = (_, i) => 50 + (50 * deltas[i]) / maxAbs; // 50=center

  return (
    <div className="bet-card">
      <div className="bet-card__head">
        <div className="bet-card__title">{title}</div>
        <span className="bet-card__days">{daysLeft} days left</span>
      </div>

      <div className="bet-list">
        {data.map((p, i) => {
          const progress = typeof p.progress === "number" ? p.progress : undefined;

          const pos    = Math.max(0, Math.min(100, progress ?? toPos(p, i)));
          const amt    =
            progress !== undefined
              ? `${progress.toFixed(0)}%`
              : `$${(p.current ?? 0).toLocaleString()}`;
          const pctRaw =
            progress !== undefined
              ? progress
              : p.baseline
                ? ((p.baseline - p.current) / p.baseline) * 100
                : 0;
          const pctLbl = `${pctRaw.toFixed(1)}%`;
          const badgeClass = pctRaw > 0 ? "good" : pctRaw < 0 ? "bad" : "neutral";

          return (
            <div key={p.id} className="bet-row">
              <div className="bet-left">
                <div className="rank">#{i + 1}</div>
                <img className="avatar" src={p.avatarUrl} alt={p.name} />
                <div className="who">
                  <div className="name">{p.name}</div>
                  <div className="amount">{amt}</div>
                </div>
                <div className={`badge ${badgeClass}`}>{pctLbl}</div>
              </div>

              <div className="bet-track">
                <div className="track-bg" />
                <div className="thumb" style={{ left: `${pos}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}