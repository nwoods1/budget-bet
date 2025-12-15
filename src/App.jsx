import { useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import CreateBet from "./pages/CreateBet";
import BetDetails from "./pages/BetDetails";
import Profile from "./pages/Profile";

import Nav from "./components/nav/Nav";

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
    <>
      <Nav />
      <div className="w-full min-h-screen flex flex-col">
        {routesElement}
      </div>
    </>
  );
}