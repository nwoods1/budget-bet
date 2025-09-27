// src/components/Nav/Nav.jsx
import { Link } from "react-router-dom";
import "./Nav.css";
import Button from "../button/Button";  

export default function Nav() {
  return (
    <nav className="navbar">
      {/* Left: Logo + Brand */}
      <div className="nav-left">
        <div className="logo-box">
          <img src="/images/logo.png" alt="logo" className="logo-img" />
        </div>
        <div className="brand">
          <span className="bet">Budget</span>
          <span className="race">Bet</span>
        </div>
      </div>

      {/* Center: Links */}
      <div className="nav-center">
        <Link to="/">Dashboard</Link>
        <Link to="/groups">My Groups</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </div>

      {/* Right: Button + Avatar */}
      <div className="nav-right">
        <Button text="New Group" onClick={() => alert("New Group clicked!")} />
        <div className="avatar">
          <img src="https://i.pravatar.cc/72?img=12" alt="user" />
        </div>
      </div>
    </nav>
  );
}