import "./ActiveBet.css";

/**
 * Props:
 * - title?: string             (headline for the bet card)
 * - daysLeft?: number|string   (right side label)
 * - participants: [{ id, name, avatarUrl, baseline, current }]
 *
 * Meaning:
 *   baseline = expected spend in the window
 *   current  = actual spend so far
 *   delta    = baseline - current  (positive = saving more; negative = overspending)
 */
export default function ActiveBet({
  title = "Save $2000 Bet",
  daysLeft = 12,
  participants = [],
}) {
  const data = participants.length
    ? participants
    : [
        { id: "u1", name: "Sarah Kim", avatarUrl: "https://i.pravatar.cc/64?img=47", baseline: 2000, current: 490 },
        { id: "u2", name: "Mike Torres", avatarUrl: "https://i.pravatar.cc/64?img=12", baseline: 2000, current: 754 },
        { id: "u3", name: "Emma Wilson", avatarUrl: "https://i.pravatar.cc/64?img=5",  baseline: 2000, current: 1086 },
        { id: "u4", name: "Alex Chen",  avatarUrl: "https://i.pravatar.cc/64?img=1",  baseline: 2000, current: 1236 },
      ];

  // delta = baseline - current (positive means saving more than expected)
  const deltas = data.map(d => (d.baseline ?? 0) - (d.current ?? 0));
  const maxAbs = Math.max(1, ...deltas.map(Math.abs)); // avoid /0
  const toPos = (_, i) => 50 + (50 * deltas[i]) / maxAbs; // map to [0..100], 50=center

  return (
    <section className="bet-section">
      <div className="bet-section__head">
        <h2>Active Bets</h2>
        <div className="bet-section__right">
          <span className="days-left">{daysLeft} days left</span>
        </div>
      </div>

      <div className="bet-card">
        <div className="bet-card__title">{title}</div>

        <div className="bet-list">
          {data.map((p, i) => {
            const pos  = Math.max(0, Math.min(100, toPos(p, i)));
            const amt  = `$${(p.current ?? 0).toLocaleString()}`;
            const pctRaw = p.baseline ? ((p.baseline - p.current) / p.baseline) * 100 : 0;
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
    </section>
  );
}