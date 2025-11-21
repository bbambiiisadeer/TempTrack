import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTracking } from "./TrackingContext";
import "./index.css";

function TrackStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackingNo: globalTrackingNo, setTrackingNo: setGlobalTrackingNo } = useTracking();
  const [trackingNo, setTrackingNo] = useState("");
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const isNavigating = useRef(false);

  // รอให้ context update แล้วค่อย navigate
  useEffect(() => {
    if (shouldNavigate && globalTrackingNo && !isNavigating.current) {
      isNavigating.current = true;
      console.log("Context updated, navigating with:", globalTrackingNo);
      
      if (user) {
        navigate("/incoming");
      } else {
        navigate("/showtemp");
      }
    }
  }, [shouldNavigate, globalTrackingNo, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNo.trim()) {
      alert("Please enter a tracking number");
      return;
    }

    try {
      console.log("Setting tracking number:", trackingNo.trim());
      setGlobalTrackingNo(trackingNo.trim());
      setShouldNavigate(true);
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
          <input
            type="text"
            name="trackingNo"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            placeholder="Enter your tracking number"
            className="border-b border-black px-3 py-3 text-sm focus:outline-none focus:ring-0 focus:border-black flex-1"
            required
          />
          <button
            type="submit"
            className="bg-black text-sm hover:bg-gray-800 text-white py-2 px-6 rounded-full h-12"
          >
            Check
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrackStatus;