import "./Home.css";
import Button from "../components/button/Button";
import StatCard from "../components/statCard/StatCard";

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
    </div>
  );
}