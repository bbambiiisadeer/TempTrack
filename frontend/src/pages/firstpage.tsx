import { Link } from "react-router-dom";
import Eye from "../components/eye";

export default function FirstPage() {
  return (
    <div className="flex h-screen w-screen bg-[#FFF9E6] fixed">
      {/* Logo */}
      <div className="relative flex items-center justify-center h-[60px]">
        <img
          src="images/blacklogo.png"
          alt="Logo"
          className="h-[55px] ml-[33px] mt-10"
        />
      </div>

      {/* ส่วนโค้งสีฟ้า */}
      <div className="w-700 h-680 left-1/2 -translate-x-1/2 top-25 absolute bg-[#5285e8] rounded-full"></div>

      {/* กล่องเนื้อหา */}
      <div className="relative z-10 text-center text-white flex flex-col items-center justify-center ml-55">
        {/* ไอคอนแว่นตา */}
        <div className="relative z-1 flex flex-col items-center justify-start -mt-40 ">
          <Eye />
        </div>

        {/* หัวข้อ */}
        <h1 className="text-6xl font-extrabold text-black mb-4 -mt-60">
          Real-time <br /> temperature monitoring
        </h1>

        {/* คำอธิบาย */}
        <p className="text-md text-black max-w-6xl mx-auto mb-6">
          Monitor the temperature in real-time during transportation and <br />{" "}
          receive instant alerts when the temperature goes outside the specified
          range
        </p>

        {/* ปุ่ม Sign in และ Log in */}
        <div className="flex items-center space-x-6">
          <Link to="/signup" className="text-black font-bold hover:underline">
            Sign up
          </Link>
          <span className="text-black">|</span>
          <Link
            to="/signin"
            className="font-bold px-6 py-2 bg-[#BBFC4C] text-black font-md rounded-lg shadow-lg hover:bg-[#F1FD46]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
