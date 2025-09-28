import "./Home.css";
import Button from "../components/button/Button";
import ActiveBet from "../components/activeBet/ActiveBet";

export default function Home() {
  // Mock bets for now — replace with API data later
  const activeBets = [
    {
      id: "b1",
      title: "Save $2000 Bet",
      daysLeft: 12,
      participants: [
        { id: "u1", name: "Alice", avatarUrl: "https://i.pravatar.cc/64?img=1", baseline: 200, current: 150 },
        { id: "u2", name: "Bob",   avatarUrl: "https://i.pravatar.cc/64?img=2", baseline: 200, current: 220 },
        { id: "u3", name: "Cara",  avatarUrl: "https://i.pravatar.cc/64?img=3", baseline: 200, current: 200 },
      ],
    },
    {
      id: "b2",
      title: "Groceries Under $400",
      daysLeft: 8,
      participants: [
        { id: "u4", name: "Dan",  avatarUrl: "https://i.pravatar.cc/64?img=4", baseline: 400, current: 180 },
        { id: "u5", name: "Eve",  avatarUrl: "https://i.pravatar.cc/64?img=5", baseline: 400, current: 260 },
      ],
    },
  ];

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

      {/* ACTIVE BETS SECTION (owned by Home) */}
      <section className="active-bets">
        <div className="active-bets__inner">
          <div className="active-bets__head">
            <h2>Active Bets</h2>
          </div>

          <div className="active-bets__list">
            {activeBets.map(bet => (
              <ActiveBet
                key={bet.id}
                title={bet.title}
                daysLeft={bet.daysLeft}
                participants={bet.participants}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}