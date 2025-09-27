// src/components/Button/Button.jsx
import "./ButtonNoPlus.css";

export default function Button({ text, onClick }) {
  return (
    <button className="new-group-btn" onClick={onClick}>
      {text}
    </button>
  );
}