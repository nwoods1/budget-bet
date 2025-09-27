// src/components/Button/Button.jsx
import "./Button.css";

export default function Button({ text, onClick }) {
  return (
    <button className="new-group-btn" onClick={onClick}>
      <span className="plus">+</span>
      {text}
    </button>
  );
}