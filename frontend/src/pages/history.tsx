import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/historyheader";
import HistoryCard from "../components/historycard";

const historyData = [
  { id: 1, trackingNo: "1234567890", dateTime: "34 ก.พ. 78", from: "กรุงเทพฯ", to: "เชียงใหม่", duration: "10", avgTemp: 2.5 },
  { id: 2, trackingNo: "0987654321", dateTime: "41 ธ.ค. 68", from: "เชียงใหม่", to: "ภูเก็ต", duration: "15", avgTemp: 3.0 },
  { id: 3, trackingNo: "1122334455", dateTime: "52 ม.พ. 20", from: "พัทยา", to: "หาดใหญ่", duration: "8", avgTemp: 4.2 },
  { id: 4, trackingNo: "5566778899", dateTime: "39 พ.ม. 91", from: "ขอนแก่น", to: "อุบลฯ", duration: "12", avgTemp: 1.8 },
  { id: 5, trackingNo: "6677889900", dateTime: "21 ก.ย. 88", from: "นครราชสีมา", to: "สุรินทร์", duration: "5", avgTemp: 2.9 },
  { id: 6, trackingNo: "7788990011", dateTime: "15 ม.ค. 79", from: "ภูเก็ต", to: "กรุงเทพฯ", duration: "14", avgTemp: 3.7 },
  { id: 7, trackingNo: "8899001122", dateTime: "07 ส.ค. 85", from: "เชียงราย", to: "นครสวรรค์", duration: "9", avgTemp: 2.3 },
  { id: 8, trackingNo: "9900112233", dateTime: "30 พ.ย. 93", from: "สงขลา", to: "ชลบุรี", duration: "11", avgTemp: 4.0 },
];

const History: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [history] = useState(historyData);

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
          <Header />
        </div>

        <h1 className="text-2xl font-bold text-black ml-1 mb-4">ประวัติ</h1>

        {/* ✅ Scrollable Container */}
        <div className="flex-1 overflow-y-auto bg-transparent rounded-lg transition-all duration-300">
          {history.length > 0 ? (
            <div className={`grid ${isSidebarCollapsed ? "grid-cols-3" : "grid-cols-2"} gap-6`}>
              {history.map((item) => (
                <HistoryCard key={item.id} {...item} isSidebarCollapsed={isSidebarCollapsed} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center mt-10">
              <svg
                width="150"
                height="150"
                viewBox="0 0 612 612"
                fill="#A5A5A5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M289.052 191.691l-36.224 87.974c-1.228 2.983-4.017 5.033-7.23 5.315L60.311 301.262c-4.546.399-7.996 4.266-7.877 8.826l3.768 145.442c.104 3.999 2.941 7.403 6.856 8.228l218.13 45.882c5.333 1.122 10.753 1.677 16.173 1.665v-43.135V193.336c0-12.006-3.74-12.746-8.311-1.645zM263.687 462.923l-81.886-13.187v-42.921h81.886v56.108zM227.882 264.073L9.518 286.138c-6.671.674-11.532-6.18-8.69-12.252l58.145-124.286a7.166 7.166 0 0 1 6.262-4.835l239.934-44.069-70.262 158.29c-2.258 5.087-4.939 7.029-8.025 7.341z"></path>
              </svg>
              <p className="text-[#A5A5A5] mt-2">ไม่มีข้อมูลประวัติ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
