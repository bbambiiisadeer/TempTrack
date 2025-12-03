import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  createdAt: string;
  parcelName: string;
  quantity: number;
  weight: number;
  senderAddress?: {
    company?: string;
    name: string;
  };
  recipientAddress?: {
    company?: string;
    name: string;
  };
  driver?: {
    regNumber?: string;
    name: string;
  };
  shippedAt?: string;
  signedAt?: string; 
}

const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  // การตั้งค่า TimeZone ใน local machine/environment
  const thaiDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const day = String(thaiDate.getDate()).padStart(2, "0");
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const year = thaiDate.getFullYear();
  const hours = String(thaiDate.getHours()).padStart(2, "0");
  const minutes = String(thaiDate.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  
  // 1. เก็บค่าสถานะตัวกรองเดิม (ใช้เฉพาะ SentPage)
  const [previousFilterStatus, setPreviousFilterStatus] = useState("all"); 
  
  // 2. เก็บเส้นทางที่เรียกใช้เดิม (Pathname: /sent หรือ /incoming)
  const [previousPath, setPreviousPath] = useState('/sent'); 

  useEffect(() => {
    if (location.state?.parcel) {
      setParcelData(location.state.parcel);
    }
    
    // 3. รับค่าสถานะตัวกรองเดิม (ถ้ามี)
    if (location.state?.previousStatus) {
        setPreviousFilterStatus(location.state.previousStatus);
    }
    
    // 4. รับค่า Pathname เดิมที่ส่งมา
    if (location.state?.previousPath) {
        setPreviousPath(location.state.previousPath);
    }
  }, [location]);

  // 5. ฟังก์ชันสำหรับกดปุ่ม Back ที่ Context-Aware
  const handleBack = () => {
      // ตรวจสอบว่าเป็น SentPage หรือไม่
      if (previousPath === '/sent' && previousFilterStatus !== 'all') {
          // ถ้ามาจาก SentPage และมีการกรองสถานะอยู่ ให้กลับไปพร้อม Query Parameter
          navigate(`${previousPath}?status=${previousFilterStatus}`);
      } else {
          // ถ้ามาจาก IncomingPage หรือ SentPage (All Status) ให้กลับไปที่ Path เดิม
          navigate(previousPath);
      }
  };

  const displayStatus = parcelData?.signedAt
    ? "Delivered At" 
    : "Shipped At";  

  const displayTime = parcelData?.signedAt
    ? formatThaiDateTime(parcelData.signedAt) 
    : formatThaiDateTime(parcelData?.shippedAt); 

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          {/* Top Section - Two boxes */}
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div
                className="bg-white rounded-l-full  p-6 flex items-center justify-center w-20 hover:bg-gray-50 transition-colors"
                // 6. เรียกใช้ handleBack
                onClick={handleBack} 
              >
                <button className="flex items-center justify-center w-12 h-12 rounded-full">
                  <IoArrowBackOutline className="w-6 h-6 text-black" />
                </button>
              </div>
            )}

            {/* Right Box - Reg Number */}
            <div
              className={`bg-white grid items-center px-8 transition-all
                ${user ? "rounded-r-full flex-1" : "rounded-full w-full pl-12"} 
              `}
              style={{
                gridTemplateColumns: "1.5fr 2.5fr 3fr 4fr 4fr 2.3fr",
              }}
            >
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Reg num</div>
                <div className="text-2xl text-black font-medium">
                  {parcelData?.driver?.regNumber || "-"}
                </div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Driver</div>
                <div className="text-lg text-black font-medium">
                  {parcelData?.driver?.name || "-"}
                </div>
              </div>
              
              {/* ส่วนที่แสดงสถานะและเวลา */}
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">
                  {displayStatus} 
                </div>
                <div className="text-lg text-black font-medium">
                  {displayTime} 
                </div>
              </div>
              {/* สิ้นสุดส่วนที่แสดงสถานะและเวลา */}

              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">From</div>
                <div className="text-lg text-black font-medium overflow-hidden text-ellipsis whitespace-nowrap pr-4">
                  {parcelData?.senderAddress?.company || "-"}
                </div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">To</div>
                <div className="text-lg text-black font-medium overflow-hidden text-ellipsis whitespace-nowrap pr-4">
                  {parcelData?.recipientAddress?.company || "-"}
                </div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Tracking No.</div>
                <div className="text-lg text-black font-medium">
                  {parcelData?.trackingNo || "-"}
                </div>
              </div>
            </div>
          </div>
          {/* Bottom Section - Large white box */}
          <div className="space-y-1 flex-1 flex flex-col">
            <div
              className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1 p-6"
              style={{ minHeight: "calc(100vh - 128px)" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;