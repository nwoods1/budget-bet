import { Link, useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import CreateBet from "./pages/CreateBet";
import BetDetails from "./pages/BetDetails";
import Profile from "./pages/Profile";

import { AuthProvider } from "./contexts/authContext";

// Adjust this import path to wherever your Header actually lives
// e.g. "./components/header" or "./components/layout/Header"



// Temporary nav to test routing (remove later)
function Nav() {
  return (
    <nav style={{ padding: "1rem", background: "#eee" }}>
      <Link to="/">Dashboard</Link> |{" "}
      <Link to="/groups">Groups</Link> |{" "}
      <Link to="/profile">Profile</Link>
      <Link to="/create-bet">Create Bet</Link> |{" "}
    </nav>
  );
}

export default function App() {
  const routesArray = [
    { path: "/", element: <Home /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/profile", element: <Profile /> },

    { path: "/groups", element: <Groups /> },
    { path: "/groups/:groupId", element: <GroupDetails /> },

    { path: "/create-bet", element: <CreateBet /> },
    { path: "/bets/:betId", element: <BetDetails /> },

    
  ];

  const routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <Nav />
      <div className="w-full min-h-screen flex flex-col">
        {routesElement}
      </div>
    </AuthProvider>
  );
}
