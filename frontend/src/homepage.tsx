import ActionBox from "./component/actionBox";
import { FaArrowRightLong } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Homepage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="absolute top-14 right-12 flex gap-38 text-black font-medium text-sm  z-20">
        {isAuthenticated ? (
          <>
            <Link to="/suggestion" className="hover:underline">
              User guide
            </Link>
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/trackstatus" className="hover:underline">
              Track status
            </Link>
            <Link to="/suggestion" className="hover:underline">
              User guide
            </Link>
            <Link to="/signin" className="hover:underline">
              Sign in
            </Link>
            <Link to="/signup" className="hover:underline">
              Sign up
            </Link>
          </>
        )}
      </div>
      <div className="absolute right-40 top-52 -translate-x-[20%] z-20">
        <ActionBox />
      </div>
      <h1
        className="
      absolute top-20 
       font-poppins font-semibold
      text-[15rem] leading-[1] whitespace-nowrap 
       transform skew-x-[-23deg] tracking-[0.34rem]
      text-black 
        left-1/2 -translate-x-1/2 -ml-[1.3rem]
    "
      >
        TEMPTRACK
      </h1>
      <div className="absolute bottom-12 left-12 max-w-xl">
        <p className="mb-6 text-black text-sm font-medium leading-relaxed ">
          Monitor the temperature in real-time during transportation <br />
          and receive instant alerts when the temperature <br />
          goes outside the specified range
        </p>
        <button
          className="relative bg-black text-sm text-white py-2 px-6 rounded-full w-36 h-12 flex items-center justify-between"
          onClick={() => navigate(isAuthenticated ? "/sent" : "/signin")}
        >
          <span className="mr-2  text-sm font-medium ">{isAuthenticated ? "Home" : "Sign in"}</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white rounded-full flex items-center justify-center overflow-visible">
            <FaArrowRightLong className="text-black text-2xl relative -left-2" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default Homepage;