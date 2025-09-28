import { useEffect, useState } from "react";
import "./GroupCreateModal.css";

export default function GroupCreateModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState(""); // comma-separated
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [bet, setBet] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      members: members
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      startDate: start || null,
      endDate: end || null,
      bet: bet.trim(),
      target: target ? Number(target) : null,
    };
    onCreate?.(payload);
    onClose?.();
  };

  return (
    <div className="gc-modal__backdrop" onClick={onClose}>
      <div
        className="gc-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gc-modal__head">
          <h3>Create New Group</h3>
          <button className="gc-x" onClick={onClose}>×</button>
        </div>

        <form className="gc-form" onSubmit={handleSubmit}>
          <label className="gc-field">
            <span>Group Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Office Savings Squad"
            />
          </label>

          <label className="gc-field">
            <span>Bet / Challenge</span>
            <input
              type="text"
              required
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              placeholder="e.g., $25 Uber Eats Gift Card"
            />
          </label>


          <div className="gc-row">
            <label className="gc-field">
              <span>Start Date</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="gc-field">
              <span>End Date</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>

          <div className="gc-actions">
            <button type="button" className="gc-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="gc-btn primary">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}