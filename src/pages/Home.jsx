import "./Home.css";
import Button from "../components/button/Button";
import StatCard from "../components/statCard/StatCard";
import ActiveRace from "../components/activeRace/ActiveRace";

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
            <Button
              text="Start Group!"
              onClick={() => console.log("Start race")}
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats__grid">
          <StatCard label="Active Races" value={3} icon="⚡" />
          {/* Later: <StatCard label="Friends" value={12} icon="👥" /> etc. */}
        </div>
      </section>

      <section className="race-section">
        <div className="race-wrap">
        {/* You can omit `participants` to use the component’s built-in demo data */}
        <ActiveRace
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