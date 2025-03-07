import React, { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    // ดึง username จาก localStorage
    const storedUsername = localStorage.getItem("username") || "Guest";
    setUsername(storedUsername);
  }, []);

  return (
    <div className="bg-white shadow-md rounded-full p-4 px-6 md:px-10 flex justify-between items-center">
      {/* Search bar และปุ่ม Add */}
      <div className="flex items-center space-x-3 flex-1">
        <div className="relative w-120 -ml-5">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search by tracking number"
            className="w-full px-10 py-2 bg-gray-100 rounded-full text-gray-600 focus:outline-none"
          />
        </div>
        <button title="เพิ่มการจัดส่ง" className=" bg-[#BBFC4C] text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-[#F1FD46] transition">
          <span
            className="material-symbols-outlined font-bold"
            style={{ fontVariationSettings: "'wght' 800" }}
          >
            add
          </span>
        </button>
      </div>

      {/* Username และตัวอักษรแรกในวงกลม */}
      <div className="flex items-center space-x-4">
        <p className="text-gray-700 font-semibold">{username}</p>
        <div className="w-10 h-10 rounded-full bg-[#5285E8] flex items-center justify-center text-white text-lg font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default Header;
