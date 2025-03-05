import React, { useState } from "react";
import * as Icons from "@ant-design/icons";

interface SidebarProps {
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle(); // ส่งการเปลี่ยนแปลงไปให้ Recent.tsx
  };

  return (
      <div
        className={`bg-white p-5 fixed top-0 left-0 min-h-screen shadow-md overflow-visible transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-[80px]" : "w-[227px]"
        }`}
      >
        {/* Logo + Toggle Button */}
        <div className="relative flex items-center justify-center h-[60px]">
          {!isCollapsed && (
            <img src="images/logo.png" alt="Logo" className="h-[55px] mr-5" />
          )}
          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 bg-[#D7E2F6] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          >
            {isCollapsed ? (
              <Icons.RightOutlined style={{ fontSize: "20px", fontWeight: "bold", color: "#5285E8" }} />
            ) : (
              <Icons.LeftOutlined style={{ fontSize: "20px", fontWeight: "bold", color: "#5285E8" }} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col justify-start mt-8 gap-2">
          {/* Notification Item */}
          <div className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-200 cursor-pointer transition-all w-full">
            <span className="text-xl flex-shrink-0"><Icons.BellOutlined /></span>
            <span
              className={`ml-2 overflow-hidden transition-all duration-300 ${
                isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              }`}
            >
              Notification
            </span>
            {!isCollapsed && (
              <span className="ml-auto bg-gray-200 text-gray-600 text-sm px-2 py-1 rounded-lg">2</span>
            )}
          </div>

          {/* Divider */}
          <hr className="border-gray-300 my-2" />

          {/* Other Menu Items */}
          {[
            { icon: <Icons.HomeOutlined />, text: "Dashboard" },
            { icon: <Icons.ClockCircleOutlined />, text: "History" },
            { icon: <Icons.FileOutlined />, text: "Overview" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-200 cursor-pointer transition-all w-full"
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span
                className={`ml-2 overflow-hidden transition-all duration-300 ${
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

  );
};

export default Sidebar;