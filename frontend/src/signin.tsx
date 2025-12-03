import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { PiEyeClosedBold } from "react-icons/pi";
import { FaEye } from "react-icons/fa";
import { useAuth } from './AuthContext';

function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [signin, setSignin] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignin((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch("http://localhost:3000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', 
        body: JSON.stringify(signin),
      });

      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        console.log("Login success:", data);

        // ตรวจสอบ isAdmin
        if (data.user.isAdmin) {
          navigate("/amdashboard"); // สำหรับ admin
        } else {
          navigate("/sent"); // สำหรับ user ปกติ
        }
      } else {
        setError(data.msg || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden overflow-y-hidden"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="absolute left-55 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl shadow-md p-8 w-130 h-120 flex flex-col justify-center items-center">
        <img
          src="/images/logo.png"
          alt="Logo"
          className="absolute -top-13 left-1/2 transform -translate-x-1/2 h-7 w-auto"
          onClick={() => navigate("/")}
        />
        
        <form className="w-full">
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex flex-col mb-10 w-full">
            <input
              type="email"
              name="email"
              placeholder="Enter your e-mail"
              value={signin.email}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm text-center resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black placeholder-gray-400"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col mb-10 w-full relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={signin.password}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm text-center resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black placeholder-gray-400 pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              disabled={isLoading}
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
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className={`text-sm text-white py-2 px-6 rounded-full w-32 h-12 transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <span className="text-sm text-gray-400 mr-2">Don't have an account?</span>
          <button
            onClick={handleSignUp}
            className="text-sm text-black hover:underline"
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>
      </div>
      
      <img
        src="/images/signinBox.png"
        alt="Signin Box"
        className="absolute top-1/2 right-0 h-160 transform -translate-y-1/2 translate-x-1/2"
      />
    </div>
  );
}

export default Signin;
