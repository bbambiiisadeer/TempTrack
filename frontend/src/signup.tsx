import { useState } from "react";
import { PiEyeClosedBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { type User } from "./types";
import { FaEye } from "react-icons/fa";
import { useAuth } from "./AuthContext";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [signup, setSignup] = useState<User>(() => {
    return {
      name: "",
      email: "",
      password: "",
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignup((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async () => {
    try {
      const res = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("User created:", data);

        const loginRes = await fetch("http://localhost:3000/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: signup.email,
            password: signup.password,
          }),
        });

        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.token, loginData.user);
          navigate("/sent");
        } else {
          alert("Account created! Please sign in.");
          navigate("/signin");
        }
      } else {
        alert(data.msg || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during signup");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignUp();
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden overflow-y-hidden"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="absolute right-55 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl shadow-md p-8 w-130 h-130 flex flex-col justify-center items-center">
        <img
          src="/images/logo.png"
          alt="Logo"
          className="absolute -top-13 left-1/2 transform -translate-x-1/2 h-7 w-auto"
          onClick={() => navigate("/")}
        />

        <form className="w-full" onSubmit={handleFormSubmit}>
          <div className="flex flex-col mb-10 w-full">
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm text-center resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col mb-10 w-full">
            <input
              type="email"
              name="email"
              placeholder="Enter your e-mail"
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm text-center resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black placeholder-gray-400"
              required
            />
          </div>

          <div className="flex flex-col mb-10 w-full relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm text-center resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black placeholder-gray-400 pr-10"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <FaEye className="w-5 h-5" />
              ) : (
                <PiEyeClosedBold className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <button
              type="submit"
              className="bg-black text-sm font-medium hover:bg-gray-800 text-white py-2 px-6 rounded-full w-32 h-12"
            >
              Sign Up
            </button>
          </div>
        </form>

        <div className="text-center">
          <span className="text-sm text-gray-400 mr-2">Already a member?</span>
          <button
            onClick={handleSignIn}
            className="text-sm text-black hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>

      <img
        src="/images/signupBox.png"
        alt="Signup Box"
        className="absolute top-1/2 left-0 h-160 transform -translate-y-1/2 -translate-x-1/2"
      />
    </div>
  );
}

export default Signup;