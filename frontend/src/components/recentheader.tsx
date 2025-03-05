import React from "react";

interface HeaderProps {
  regNum: string;
  sender: string;
  timestamp: string;
  trackingNo: string;
}

const Header: React.FC<HeaderProps> = ({ regNum, sender, timestamp, trackingNo }) => {
  const copyToClipboard = () => {
    const cleanTrackingNo = trackingNo.replace("#", ""); // ลบ #
    navigator.clipboard.writeText(cleanTrackingNo);
    alert(`คัดลอก Tracking No. เรียบร้อยแล้ว`);
  };
  
  return (
    <div className="bg-white shadow-md rounded-full p-4 px-6 md:px-10 flex justify-between items-center">
      <div>
        <p className="text-[#A5A5A5] text-sm">Reg. num</p>
        <p className="text-3xl font-bold">{regNum}</p>
      </div>
      <div>
        <p className="text-[#A5A5A5] text-sm">ชื่อผู้ส่ง</p>
        <p className="text-lg mt-1 font-semibold">{sender}</p>
      </div>
      <div>
        <p className="text-[#A5A5A5] text-sm">วันที่, เวลาส่ง</p>
        <p className="text-lg mt-1 font-semibold">{timestamp}</p>
      </div>
      <div>
        <p className="text-gray-500 text-sm">Tracking No.</p>
        <p className="text-lg mt-1 font-semibold text-[#5285E8]" onClick={copyToClipboard}>{trackingNo}</p>
      </div>
    </div>
  );
};

export default Header;