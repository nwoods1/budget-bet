import { doSignOut } from "../firebase/auth";
import { useNavigate, Link } from "react-router-dom";

export default function TopBar() {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await doSignOut();
      navigate("/login");
    } catch {
      // ignore for MVP
    }
  }

  return (
    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid #eee"}}>
      <nav style={{display:"flex",gap:12}}>
        <Link to="/">Home</Link>
        <Link to="/groups">Groups</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <button onClick={handleLogout} style={{padding:"6px 12px"}}>Logout</button>
    </header>
  );
}
