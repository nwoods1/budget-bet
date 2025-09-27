import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>This is your home page. You can see your groups and active bets here.</p>

      {/* New button to navigate to Create Bet page */}
      <Link to="/create-bet" style={{
        display: "inline-block",
        padding: "0.5rem 1rem",
        backgroundColor: "#4f46e5",
        color: "#fff",
        borderRadius: "0.25rem",
        textDecoration: "none"
      }}>
        Create Bet
      </Link>
    </div>
  );
}
