// src/components/Nav/Nav.jsx
import { Link } from "react-router-dom";
import "./Nav.css";

export default function Nav() {
  return (
    <nav className="navbar">
      <Link to="/">Dashboard</Link>
      <Link to="/groups">Groups</Link>
      <Link to="/profile">Profile</Link>
      <Link to="/create-bet">Create Bet</Link>
    </nav>
  );
}