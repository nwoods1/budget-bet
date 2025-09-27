import "./Home.css";
import Button from "../components/button/Button";
import ActiveBet from "../components/activeBet/ActiveBet";

export default function Home() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero__overlay">
          <h1 className="hero__title">
            <span className="thin">Challenge</span>{" "}
            <span className="accent1">Your</span>{" "}
            <span className="accent2">Friends</span>
            <br />
            <span className="bold">Race to Your Goals</span>
          </h1>

          <p className="hero__subtitle">
            Create group challenges, vote on ideas, and track your progress in real-time.
            Turn savings and spending goals into exciting competitions.
          </p>

          <div className="hero__actions">
            <Button />
          </div>
        </div>
      </section>

      {/* ACTIVE BETS */}
      <section className="bet-section">
        <div className="race-wrap">{/* keeps your spacing if you had it */}
          <ActiveBet
            title="Save $2000 Bet"
            participants={[
              { id: "u1", name: "Alice", avatarUrl: "https://i.pravatar.cc/64?img=1", baseline: 200, current: 150 },
              { id: "u2", name: "Bob",   avatarUrl: "https://i.pravatar.cc/64?img=2", baseline: 200, current: 220 },
              { id: "u3", name: "Cara",  avatarUrl: "https://i.pravatar.cc/64?img=3", baseline: 200, current: 200 },
            ]}
          />

          <ActiveBet
            title="Save $2000 Bet"
            participants={[
              { id: "u1", name: "Alice", avatarUrl: "https://i.pravatar.cc/64?img=1", baseline: 200, current: 150 },
              { id: "u2", name: "Bob",   avatarUrl: "https://i.pravatar.cc/64?img=2", baseline: 200, current: 220 },
              { id: "u3", name: "Cara",  avatarUrl: "https://i.pravatar.cc/64?img=3", baseline: 200, current: 200 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}