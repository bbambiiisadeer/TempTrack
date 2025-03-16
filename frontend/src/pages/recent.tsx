import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/recentheader";
import CardTemp from "../components/cardtemp";

const Recent: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [temperatureData, setTemperatureData] = useState<
    { time: string; outsideTemp: number; insideTemp: number }[]
  >([]);

  const headerData = {
    regNum: "จจ 323",
    sender: "คริสติน่า แซ่แต้",
    timestamp: "35 ก.พ. 2568, 18:22 น.",
    trackingNo: "#24382148645",
  };

  // -------
  // ขอบเขตอุณหภูมิที่กำหนด (จะรับค่าจาก getInfo.tsx ในอนาคต)
  const minTemp = 10;
  const maxTemp = 20;

  useEffect(() => {
    // ใช้ WebSocket หรือ API polling เพื่อรับข้อมูลเรียลไทม์
    const fetchTemperature = () => {
      // 🔹 **ตัวอย่างข้อมูลที่ได้รับจากเซ็นเซอร์**
      const newTemp = {
        time: new Date().toLocaleTimeString(),
        outsideTemp: Math.random() * (35 - 5) + 5, // จำลองอุณหภูมินอกกล่องระหว่าง 5 - 35 องศา
        insideTemp: Math.random() * (30 - 5) + 5, // จำลองอุณหภูมิในกล่องระหว่าง 5 - 30 องศา
      };

      // อัปเดตข้อมูล 
      setTemperatureData((prev) => [newTemp, ...prev]);
    };

    // ตั้งให้ฟังก์ชัน `fetchTemperature` ทำงานทุก 1 วินาที
    const interval = setInterval(fetchTemperature, 1000);

    return () => clearInterval(interval);
  }, []);
  // -------

  return (
    <div className="flex h-screen w-screen bg-[#FFF9E6] fixed">
      <Sidebar onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          !isSidebarCollapsed ? "ml-62 mr-5" : "ml-25 mr-5"
        }`}
      >
        {/* Header */}
        <div className="p-6">
          <Header {...headerData} />
        </div>

        {/* Scrollable Content (ขยายกว้างเท่า Header) */}
        <div className="mt-[-4] flex-1 overflow-y-auto p-4 bg-white shadow-md rounded-lg transition-all duration-300">
          {temperatureData.length > 0 ? (
            temperatureData.map((data, index) => (
              <CardTemp
                key={index}
                time={data.time}
                outsideTemp={data.outsideTemp}
                insideTemp={data.insideTemp}
                minTemp={minTemp}
                maxTemp={maxTemp}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">รอข้อมูลจากเซ็นเซอร์...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recent;
