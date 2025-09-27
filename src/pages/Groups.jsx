import "./Groups.css";
import GroupCard from "../components/groupCard/GroupCard";

export default function Groups() {
  const currentUserId = "me-123";

  const groups = [
    {
      id: "g1",
      title: "Office Savings Squad",
      status: "active",
      budget: 5000,
      daysLeft: 18,
      members: [
        { id: "me-123", name: "You", avatarUrl: "https://i.pravatar.cc/64?img=64" },
        { id: "1", name: "Sara", avatarUrl: "https://i.pravatar.cc/64?img=15" },
        { id: "2", name: "Amir", avatarUrl: "https://i.pravatar.cc/64?img=20" },
        { id: "3", name: "Leah", avatarUrl: "https://i.pravatar.cc/64?img=33" },
        { id: "4", name: "Tom", avatarUrl: "https://i.pravatar.cc/64?img=43" },
      ],
    },
    {
      id: "g2",
      title: "Fitness Friends Challenge",
      status: "voting",
      budget: 1000,
      daysLeft: 12,
      members: [
        { id: "5", name: "Mike", avatarUrl: "https://i.pravatar.cc/64?img=12" },
        { id: "6", name: "Ana", avatarUrl: "https://i.pravatar.cc/64?img=7" },
        { id: "7", name: "Luis", avatarUrl: "https://i.pravatar.cc/64?img=24" },
        { id: "me-123", name: "You", avatarUrl: "https://i.pravatar.cc/64?img=64" },
      ],
    },
    {
      id: "g3",
      title: "Monthly Budget Battle",
      status: "completed",
      budget: 3000,
      daysLeft: 0,
      members: [
        { id: "9",  name: "Joy", avatarUrl: "https://i.pravatar.cc/64?img=48" },
        { id: "10", name: "Ari", avatarUrl: "https://i.pravatar.cc/64?img=36" },
        { id: "11", name: "Ken", avatarUrl: "https://i.pravatar.cc/64?img=3"  },
        { id: "12", name: "Zoe", avatarUrl: "https://i.pravatar.cc/64?img=56" },
        { id: "13", name: "Bo",  avatarUrl: "https://i.pravatar.cc/64?img=22" },
      ],
    },
  ];

  // Map each status to a CTA text
  const getCtaText = (status) => {
    switch (status) {
      case "active":
        return "View Race";
      case "voting":
        return "Vote on Ideas";
      case "completed":
        return "View Results";
      default:
        return "View";
    }
  };

  return (
    <section className="groups-page">
      <div className="groups-head">
        <h2>My Groups</h2>
      </div>

      <div className="groups-list">
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            title={g.title}
            status={g.status}
            budget={g.budget}
            daysLeft={g.daysLeft}
            members={g.members}
            currentUserId={currentUserId}
            ctaText={getCtaText(g.status)}  
            onClick={() => console.log("Open group:", g.id)}
          />
        ))}
      </div>
    </section>
  );
}