import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTracking } from "./TrackingContext";
// 💡 เพิ่ม FaPaste
import { FaPaste } from "react-icons/fa"; 
import "./index.css";

function TrackStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTrackingNo } = useTracking();
  const [trackingNo, setTrackingNo] = useState("");

  // 💡 ฟังก์ชันจัดการการวาง (Paste)
  const handlePaste = async () => {
    try {
      // ดึงข้อความจากคลิปบอร์ด
      const text = await navigator.clipboard.readText();
      // ลบช่องว่างหรือเครื่องหมายที่ไม่จำเป็นออกก่อนตั้งค่า
      setTrackingNo(text.trim().replace(/[^a-zA-Z0-9#]/g, '')); 
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
      // alert("Unable to paste. Please ensure clipboard access is allowed.");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!trackingNo.trim()) {
    alert("Please enter a tracking number");
    return;
  }

  try {
    console.log("Adding tracking number:", trackingNo.trim());
    
    if (user) {
      // ถ้า login แล้ว: เพิ่ม tracking number เข้า context แล้วไปหน้า incoming
      addTrackingNo(trackingNo.trim());
      navigate("/incoming");
    } else {
      // ถ้าไม่ได้ login: fetch ข้อมูล parcel แล้วไปหน้า report
      const formattedTrackingNo = trackingNo.trim().startsWith("#")
        ? trackingNo.trim()
        : `#${trackingNo.trim()}`;
      
      const res = await fetch(
        `http://localhost:3000/parcel/track/${encodeURIComponent(formattedTrackingNo)}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        alert("Parcel not found");
        return;
      }

      const parcel = await res.json();
      navigate("/report", { state: { parcel } });
    }
  } catch (err) {
    console.error(err);
    alert("Error checking tracking status");
  }
};

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex flex-row items-center gap-x-6 -mt-30 mb-4">
        <img src="/images/box4.png" alt="Box4" className="w-12" />
        <img src="/images/box5.png" alt="Box5" className="w-12" />
        <img src="/images/box6.png" alt="Box6" className="w-20 -mt-3" />
      </div>
      <h1 className="text-[64px] font-semibold">track your</h1>
      <h2 className="text-[64px] font-semibold italic -mt-7 mb-6">
        Parcel Status
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl h-25 shadow-md w-full max-w-[860px] py-5.5 px-10"
      >
        <div className="flex items-center justify-center mb-6 space-x-4">
          
          {/* 💡 Container สำหรับ Input และ Paste Button */}
          <div className="relative flex-1 flex items-center"> 
            <input
              type="text"
              name="trackingNo"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="Enter your tracking number"
              // ปรับ padding ด้านขวาให้มีที่ว่างสำหรับปุ่ม Paste
              className="border-b border-black pl-3 pr-10 py-3 text-sm focus:outline-none focus:ring-0 focus:border-black flex-1"
              required
            />
            
            {/* 💡 ปุ่ม Paste */}
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Paste tracking number"
            >
              <FaPaste className="w-4 h-4 text-black" />
            </button>
          </div>

          <button
            type="submit"
            className="bg-black text-sm hover:bg-gray-800 font-medium text-white py-2 px-6 rounded-full h-12"
          >
            Check
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrackStatus;