import React from "react";

interface HistoryCardProps {
  trackingNo: string;
  dateTime: string;
  from: string;
  to: string;
  duration: string;
  avgTemp: number;
  isSidebarCollapsed: boolean;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  trackingNo,
  dateTime,
  from,
  to,
  duration,
  avgTemp,
  isSidebarCollapsed
}) => {
  return (
    <div className={`bg-white rounded-lg p-6 ${isSidebarCollapsed ? "w-106 h-65" : "w-145 h-65"} transition-all duration-300`}>
      {/* Tracking No & Date */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#a5a5a5] text-sm">Tracking No.</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-black font-bold text-lg">#{trackingNo}</span>
        <span className="text-black text-base">{dateTime}</span>
      </div>

      {/* From -> To */}
      <div className="mt-3 text-black text-sm">
        <span className="text-base">จาก <span className="font-bold text-base">{from}</span> ไป <span className="font-bold text-base">{to}</span></span>
      </div>

      {/* ระยะเวลาจัดส่ง */}
      <div className="mt-4">
        <span className="text-[#a5a5a5] text-sm">ระยะเวลาจัดส่ง</span>
        <div className="text-black font-bold text-base">{duration} ชั่วโมง</div>
      </div>

      {/* อุณหภูมิเฉลี่ยขณะจัดส่ง */}
      <div className="mt-2">
        <span className="text-[#a5a5a5] text-sm">อุณหภูมิเฉลี่ยขณะจัดส่ง</span>
        <div className="text-black font-bold text-base">{avgTemp.toFixed(2)} °C</div>
      </div>

      {/* ปุ่ม "จัดส่งสำเร็จ" */}
      <div className="flex justify-end -mt-9">
        <button className="bg-[#FA6255] text-white px-6 py-2 rounded-full text-sm hover:bg-[#DC4437] transition-all">
          จัดส่งสำเร็จ
        </button>
      </div>
    </div>
  );
};

export default HistoryCard;
