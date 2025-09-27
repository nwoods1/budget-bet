import "./ActiveRace.css";

/**
 * Props:
 * - title?: string            (optional section title for the card header)
 * - daysLeft?: number|string  (shown on the right)
 * - participants: [{ id, name, avatarUrl, baseline, current }]
 */
export default function ActiveRace({
  title = "Save $2000 Challenge",
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
  const maxAbs = Math.max(1, ...deltas.map(Math.abs));
  const percent = (d, i) => 50 + (50 * deltas[i]) / maxAbs; // 0..100, 50=center

  return (
    <section className="race-section">
      <div className="race-section__head">
        <h2>Active Race</h2>
        <div className="race-section__right">
          <span className="days-left">{daysLeft} days left</span>
        </div>
      </div>

      <div className="race-card">
        <div className="race-card__title">{title}</div>

        <div className="race-list">
          {data.map((p, i) => {
            const delta = deltas[i];
            const pos = Math.max(0, Math.min(100, percent(p, i)));
            const amount = `$${(p.current ?? 0).toLocaleString()}`;
            const pctRaw = p.baseline
             ? ((p.baseline - p.current) / p.baseline) * 100 : 0;

            const pctLabel = `${pctRaw.toFixed(1)}%`;

            return (
              <div key={p.id} className="race-row">
                <div className="race-left">
                  <div className="rank">#{i + 1}</div>
                  <img className="avatar" src={p.avatarUrl} alt={p.name} />
                  <div className="who">
                    <div className="name">{p.name}</div>
                    <div className="amount">{amount}</div>
                  </div>
                  <div className="badge">{pctLabel}</div>
                </div>

                <div className="race-track">
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