import "./GroupCard.css";
import ButtonNoPlus from "../buttonNoPlus/ButtonNoPlus";

/**
 * Props:
 * - title: string
 * - status: "active" | "voting" | "completed"
 * - budget: number  (e.g., 5000)
 * - daysLeft?: number
 * - members: [{ id, name, avatarUrl }]
 * - currentUserId: string
 * - ctaText: string
 * - onClick: () => void
 */
export default function GroupCard({
  title,
  status = "active",
  budget = 0,
  daysLeft,
  members = [],
  currentUserId,
  ctaText = "View",
  onClick,
}) {
  // hide current user and compute visible + overflow
  const others = members.filter(m => m.id !== currentUserId);
  const visible = others.slice(0, 3);
  const overflow = Math.max(0, others.length - visible.length);

  const statusLabel =
    status === "active" ? "Active Bet"
    : "Completed";

  return (
    <div className="group-card">
      <div className="group-card__head">
        <h3 className="group-card__title">{title}</h3>
        <span
          className={
            "group-card__status " +
            (status === "active" ? "is-active" : "is-completed")
          }
        >
          {statusLabel}
        </span>
      </div>

      <div className="group-card__row">
        <div className="pill">
          <span className="icon">👥</span>
          <span>{others.length} participants</span>
        </div>

        <div className="avatars">
          {visible.map(m => (
            <img key={m.id} className="avatar" src={m.avatarUrl} alt={m.name} />
          ))}
          {overflow > 0 && <span className="avatar avatar-more">+{overflow}</span>}
        </div>
      </div>

    </div>
  );
}