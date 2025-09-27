import { Link, useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import CreateBet from "./pages/CreateBet";
import BetDetails from "./pages/BetDetails";
import Profile from "./pages/Profile";
import { useAuth } from "./contexts/authContext";
import { doSignOut } from "./firebase/auth";

function Nav() {
  const { currentUser, userLoggedIn } = useAuth();

  return (
    <nav className="w-full bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-lg tracking-wide">
            Budget Bet
          </Link>
          {userLoggedIn && (
            <div className="hidden sm:flex gap-3 text-sm text-slate-200">
              <Link className="hover:underline" to="/">
                Dashboard
              </Link>
              <Link className="hover:underline" to="/groups">
                Groups
              </Link>
              <Link className="hover:underline" to="/create-bet">
                Create Bet
              </Link>
              <Link className="hover:underline" to="/profile">
                Profile
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {userLoggedIn && currentUser ? (
            <>
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                    {currentUser.displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
                <span className="font-medium text-slate-100">
                  {currentUser.displayName || currentUser.email}
                </span>
              </div>
              <button
                onClick={doSignOut}
                className="rounded-md border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-indigo-500 px-3 py-1 font-semibold text-white hover:bg-indigo-600"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const routesArray = [
    { path: "/", element: <Home /> },
    { path: "/home", element: <Home /> },
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:py-12">
        {routesElement}
      </main>
    </div>
  );
}
