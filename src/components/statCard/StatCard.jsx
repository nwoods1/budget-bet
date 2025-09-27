import "./StatCard.css";

export default function StatCard({ label, value, icon }) {
  return (
    <div className="card">
      <div className="card__label">{label}</div>
      <div className="card__value">{value}</div>
      {icon && <div className="card__icon">{icon}</div>}
    </div>
  );
}