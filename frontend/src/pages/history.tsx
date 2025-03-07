import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/historyheader";

const History: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
    useEffect(() => {
      const storedUsername = localStorage.getItem("username") || "Guest";
    }, []);

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
        <div className="flex flex-col flex-1 overflow-y-auto transition-all duration-300">
          {/* หัวข้อ "ประวัติ" */}
          <h1 className="text-2xl font-bold text-black ml-8 mb-4">ประวัติ</h1>

          {/* ส่วนแสดงผลของหน้า History */}
          <div className="flex flex-1 items-center justify-center p-4 bg-transparent rounded-lg transition-all duration-300">
            <div className="flex flex-col items-center">
              <svg
                width="187"
                height="187"
                viewBox="0 0 612 612"
                fill="#A5A5A5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M289.052 191.691l-36.224 87.974c-1.228 2.983-4.017 5.033-7.23 5.315L60.311 301.262c-4.546.399-7.996 4.266-7.877 8.826l3.768 145.442c.104 3.999 2.941 7.403 6.856 8.228l218.13 45.882c5.333 1.122 10.753 1.677 16.173 1.665v-43.135V193.336c0-12.006-3.74-12.746-8.311-1.645zM263.687 462.923l-81.886-13.187v-42.921h81.886v56.108zM227.882 264.073L9.518 286.138c-6.671.674-11.532-6.18-8.69-12.252l58.145-124.286a7.166 7.166 0 0 1 6.262-4.835l239.934-44.069-70.262 158.29c-2.258 5.087-4.939 7.029-8.025 7.341zM551.689 301.262l-185.286-16.281c-3.214-.282-6.003-2.332-7.23-5.315l-36.225-87.974c-4.571-11.102-8.312-10.362-8.312 1.644v274.833l.004 43.135c5.419.013 10.84-.543 16.174-1.665l218.13-45.882c3.915-.824 6.752-4.229 6.855-8.228l3.768-145.441c.119-4.56-3.333-8.426-7.878-8.826zM475.437 378.948l-10.233.283-.207 64.406c-.009 2.837-2.891 5.55-6.475 6.065l-16.771 2.412c-3.831.551-6.966-1.412-6.959-4.392l.156-67.651-11.705.324c-5.691.157-9.292-4.406-6.395-8.183l27.837-36.274c2.637-3.438 9.109-3.121 11.651.501l24.435 34.825c2.884 4.107-.045 8.356-4.766 8.488zM602.481 286.138l-218.364-22.065c-3.086-.312-5.768-2.254-7.025-5.088l-70.261-158.29 239.934 44.069a7.166 7.166 0 0 1 6.263 4.835l58.145 124.286c2.842 6.072-2.02 12.926-8.691 12.252z"></path>
              </svg>
              <p className="text-[#A5A5A5] mt-2">ไม่มีข้อมูลประวัติ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
