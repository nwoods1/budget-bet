import { useState } from "react";
import { useAuth } from "../contexts/authContext";
import {
  doCreateUserWithEmailAndPassword,
  setAuthDisplayName
} from "../firebase/auth";
import { useNavigate, Navigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Simple username check (3–20 chars letters/numbers/._-)
    if (!/^[a-z0-9._-]{3,20}$/i.test(username.trim())) {
      setErrorMessage(
        "Username must be 3–20 characters using letters, numbers, dot, underscore, or dash."
      );
      return;
    }

    try {
      setErrorMessage("");
      setIsRegistering(true);

      // 1) Create auth user
      const cred = await doCreateUserWithEmailAndPassword(email, password);

      // 2) Store username in Firebase Auth profile (displayName)
      await setAuthDisplayName(username.trim());

      // 3) Redirect to home (auth context guard will handle)
      navigate("/");
    } catch (err) {
      setErrorMessage(err?.message || "Sign up failed.");
      setIsRegistering(false);
    }
  };

  return (
    <>
      {userLoggedIn && <Navigate to={"/"} replace={true} />}

      <main className="w-full h-screen flex self-center place-content-center place-items-center">
        <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
          <div className="text-center mb-6">
            <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">
              Create a New Account
            </h3>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Username input */}
            <div>
              <label className="text-sm text-gray-600 font-bold">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. budget_ninja"
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                3–20 chars: letters, numbers, dot, underscore, or dash.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-600 font-bold">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-600 font-bold">Password</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                disabled={isRegistering}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-gray-600 font-bold">Confirm Password</label>
              <input
                type="password"
                autoComplete="off"
                required
                disabled={isRegistering}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
            </div>

            {errorMessage && (
              <span className="text-red-600 font-bold">{errorMessage}</span>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className={`w-full px-4 py-2 text-white font-medium rounded-lg ${
                isRegistering
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300"
              }`}
            >
              {isRegistering ? "Signing Up..." : "Sign Up"}
            </button>

            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link to={"/login"} className="hover:underline font-bold">
                Continue
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Register;
