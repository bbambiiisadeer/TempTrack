import React from "react";

interface CardTempProps {
  time: string;
  outsideTemp: number;
  insideTemp: number;
  minTemp: number;
  maxTemp: number;
}

const CardTemp: React.FC<CardTempProps> = ({ time, outsideTemp, insideTemp, minTemp, maxTemp }) => {
  const isTempNormal = insideTemp >= minTemp && insideTemp <= maxTemp;

  return (
    <div className="flex items-start border-b border-gray-300 py-4 px-4 gap-x-10">
      {/* เวลา */}
      <div className="flex items-center w-1/6">
        <span className="text-[#A5A5A5] text-sm">เวลา</span>
        <span className="text-base ml-6">{time}</span>
      </div>

      {/* อุณหภูมิเฉลี่ยนอกกล่อง */}
      <div className="w-1/4 flex items-center ml-8 text-right">
        <span className="text-[#A5A5A5] text-sm">อุณหภูมินอกกล่อง (°C)</span>
        <span className="text-base ml-6">{outsideTemp.toFixed(1)}</span>
      </div>

      {/* อุณหภูมิเฉลี่ยภายในกล่อง */}
      <div className="w-1/4 flex items-center ml-8 text-right">
        <span className="text-[#A5A5A5] text-sm">อุณหภูมิในกล่อง (°C)</span>
        <span className="text-base ml-6">{insideTemp.toFixed(1)}</span>
      </div>

      {/* สถานะ */}
      <div className="w-1/5 flex justify-end ml-auto items-center">
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
