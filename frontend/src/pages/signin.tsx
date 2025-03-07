import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // ✅ ใช้ navigate เพื่อนำทางหลังจากล็อกอิน

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User Info:", result.user);
      alert(`Signed in as ${result.user.displayName}`);
      navigate("/dashboard"); // ✅ นำทางไปหน้า dashboard หลังจากล็อกอินสำเร็จ
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FFF9E6] fixed">
      {/* Logo */}
      <div className="absolute left-[33px] top-5.5">
        <img src="images/blacklogo.png" alt="Logo" className="h-[55px]" />
      </div>

      {/* กล่องเนื้อหา */}
      <div className="flex flex-grow justify-center items-center w-full">
        <div className="w-full max-w-xl bg-transparent p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Sign in</h1>
          <p className="text-[#A5A5A5] mb-6">
            Welcome back, Enter your details to access your account
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center gap-2 px-4 py-2 bg-[#F0F0F0] rounded-md hover:bg-[#D5D5D5] transition font-bold text-[#A5A5A5] mx-auto"
          >
            <span
              className="w-6 h-6"
              dangerouslySetInnerHTML={{
                __html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>`,
              }}
            />
            Sign in with Google
          </button>

          {/* เส้นคั่น */}
          <div className="flex items-center my-4">
            <hr className="w-full border-[#A5A5A5]" />
            <span className="mx-2 text-[#A5A5A5]">or</span>
            <hr className="w-full border-[#A5A5A5]" />
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#A5A5A5]">
                mail
              </span>
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-12 p-3 bg-white border border-[#A5A5A5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#A5A5A5]">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-12 pr-10 p-3 bg-white border border-[#A5A5A5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#A5A5A5] hover:text-[#9B9B9B]"
              >
                <span className="material-symbols-outlined scale-x-[-1]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button className="w-full bg-[#5285E8] font-bold text-white py-2 rounded-lg mt-4 hover:bg-[#3265C8] transition">
            Sign in
          </button>

          {/* Sign Up Link */}
          <p className="mt-4 text-[#A5A5A5]">
            You haven’t any account?{" "}
            <Link
              to="/signup"
              className="ml-2 text-[#5285E8] font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
