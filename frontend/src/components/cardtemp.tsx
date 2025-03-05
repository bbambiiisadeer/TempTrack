import React from "react";

interface CardTempProps {
  time: string;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
}

const CardTemp: React.FC<CardTempProps> = ({ time, avgTemp, minTemp, maxTemp }) => {
  const isTempNormal = avgTemp >= minTemp && avgTemp <= maxTemp;

  return (
    <div className="flex items-start border-b border-gray-300 py-4 px-4 gap-x-10">
      {/* เวลา */}
      <div className="flex items-center w-1/5">
        <span className="text-[#A5A5A5] text-sm">เวลา</span>
        <span className="text-base ml-6">{time}</span>
      </div>

      {/* อุณหภูมิเฉลี่ย */}
      <div className="w-2/5 flex items-center ml-8 text-right">
        <span className="text-[#A5A5A5] text-sm">อุณหภูมิเฉลี่ย (°C)</span>
        <span className="text-base ml-6">{avgTemp.toFixed(1)}</span>
      </div>

      {/* สถานะ */}
      <div className="w-1/5 flex justify-end items-center ml-100">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isTempNormal ? "bg-[#7ECE05]" : "bg-[#FA6255]"}`}></div>
          <span className={`text-base ${isTempNormal ? "text-[#7ECE05]" : "text-[#FA6255]"}`}>
            {isTempNormal ? "ปกติ" : "เกินกำหนด"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardTemp;