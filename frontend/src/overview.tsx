import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaRegCheckCircle } from "react-icons/fa";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";
import { type Address } from "./types";

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  createdAt: string;
  parcelName: string;
  quantity: number;
  weight: number;
  senderAddress?: Address;
  recipientAddress?: Address;
  driver?: {
    regNumber?: string;
    name: string;
  };
  shippedAt?: string;
  signedAt?: string;
  signature?: string;
  temperatureRangeMin?: number;
  temperatureRangeMax?: number;
}

// ... (formatThaiDateTime, formatTimeLabel, generateTimeLabels เหมือนเดิม) ...
const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const thaiDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const day = String(thaiDate.getDate()).padStart(2, "0");
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const year = thaiDate.getFullYear();
  const hours = String(thaiDate.getHours()).padStart(2, "0");
  const minutes = String(thaiDate.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatTimeLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const thaiDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  return `${String(thaiDate.getHours()).padStart(2, "0")}:${String(thaiDate.getMinutes()).padStart(2, "0")}`;
};

const generateTimeLabels = (shippedAt: string, signedAt: string): string[] => {
  const startTime = new Date(shippedAt).getTime();
  const endTime = new Date(signedAt).getTime();
  const timeInterval = (endTime - startTime) / 12;
  const labels: string[] = [];
  for (let i = 0; i < 13; i++) {
    const time = new Date(startTime + timeInterval * i);
    labels.push(formatTimeLabel(time.toISOString()));
  }
  return labels;
};

// --- Logic แกน Y ที่แก้ไขให้เป็น 0 แน่นอน ---
const generateYAxisLabels = (min: number, max: number) => {
  const step = (max - min) / 4;
  
  // 1. คำนวณค่าจริงตาม step เพื่อใช้รักษาระยะห่างกราฟ (Actual Position)
  const actualBottom = min - step;

  // 2. กำหนด Label ที่จะแสดง
  const levels = [
    { display: parseFloat((max + step).toFixed(1)), posValue: max + step }, 
    { display: parseFloat(max.toFixed(1)), posValue: max },          
    { display: parseFloat(min.toFixed(1)), posValue: min },          
    { display: 0, posValue: actualBottom } // บังคับเขียนเลข 0 ลงไปเลย
  ];

  // ✅ ถ้า Min ติดลบ ให้เปลี่ยนบรรทัดสุดท้ายกลับไปใช้ค่าติดลบตามสูตร
  if (min < 0) {
    levels[3].display = parseFloat(actualBottom.toFixed(1));
  }

  const absoluteMin = actualBottom; 
  const absoluteMax = max + step;

  return { levels, absoluteMin, absoluteMax };
};

function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [previousFilterStatus, setPreviousFilterStatus] = useState("all");
  const [previousPath, setPreviousPath] = useState("/sent");

  useEffect(() => {
    if (location.state?.parcel) setParcelData(location.state.parcel);
    if (location.state?.previousStatus) setPreviousFilterStatus(location.state.previousStatus);
    if (location.state?.previousPath) setPreviousPath(location.state.previousPath);
  }, [location]);

  const handleBack = () => {
    if (previousPath === "/sent" && previousFilterStatus !== "all") {
      navigate(`${previousPath}?status=${previousFilterStatus}`);
    } else {
      navigate(previousPath);
    }
  };

  const hasTempData = parcelData?.temperatureRangeMin !== undefined && parcelData?.temperatureRangeMax !== undefined;

  const tempRangeData = hasTempData 
    ? generateYAxisLabels(parcelData.temperatureRangeMin!, parcelData.temperatureRangeMax!) 
    : { levels: [], absoluteMin: 0, absoluteMax: 0 };

  const { levels: yAxisLabels, absoluteMin, absoluteMax } = tempRangeData;
  const totalTempRange = absoluteMax - absoluteMin;

  const timeLabels = parcelData?.shippedAt && parcelData?.signedAt 
    ? generateTimeLabels(parcelData.shippedAt, parcelData.signedAt) 
    : [];

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          {/* Header */}
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div className="bg-white rounded-l-full p-6 flex items-center justify-center w-20 hover:bg-gray-50 cursor-pointer" onClick={handleBack}>
                <button className="flex items-center justify-center w-12 h-12 rounded-full">
                  <IoArrowBackOutline className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
            <div className={`bg-white flex items-center justify-between px-8 ${user ? "rounded-r-full flex-1" : "rounded-full w-full pl-12"}`}>
              <h2 className="text-2xl font-semibold text-black">Overview</h2>
              <div className="flex items-center h-full py-3">
                <div className="text-sm text-gray-400 mr-4">Tracking No.</div>
                <div className="text-lg text-black font-medium">{parcelData?.trackingNo || "-"}</div>
                <span className="text-2xl text-black font-light mx-4 mr-2">|</span>
                <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                  <FaRegCheckCircle className="text-black w-4 h-4 mr-3" /> Delivered
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-white rounded-xl shadow-md p-6 w-full h-40 flex justify-center items-center gap-4">
              <div className="flex flex-col items-center">
                <img src="/images/signupBox.png" className="h-10" alt="pending" />
                <p className="font-medium text-black text-sm mt-3">Pending</p>
                <p className="text-xs text-gray-500">{formatThaiDateTime(parcelData?.createdAt)}</p>
              </div>
              <div className="w-30 h-0.5 bg-black"></div>
              <div className="flex flex-col items-center">
                <img src="/images/deliveredCar.png" className="h-10" alt="shipped" />
                <p className="font-medium text-black text-sm mt-3">Shipped</p>
                <p className="text-xs text-gray-500">{formatThaiDateTime(parcelData?.shippedAt)}</p>
              </div>
              <div className="w-30 h-0.5 bg-black"></div>
              <div className="flex flex-col items-center">
                <img src="/images/signinBox.png" className="h-10" alt="delivered" />
                <p className="font-medium text-black text-sm mt-3">Delivered</p>
                <p className="text-xs text-gray-500">{formatThaiDateTime(parcelData?.signedAt)}</p>
              </div>
            </div>

            {/* Middle Cards */}
            <div className="flex gap-8 w-full h-48">
              <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                <p className="font-medium text-black text-base">Proof of Delivery</p>
                <img src={parcelData?.signature} alt="Signature" className="mt-6 w-full h-24 object-contain rounded" />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex-1 text-sm">
                <p className="font-medium text-black text-base mb-3">Shipping Address</p>
                {parcelData?.recipientAddress ? (
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      {parcelData.recipientAddress.name}
                      <span className="border-l border-gray-400 h-4"></span>
                      <span className="text-gray-400 text-sm font-normal">{parcelData.recipientAddress.phoneNumber}</span>
                    </p>
                    <p>{parcelData.recipientAddress.company}</p>
                    <p className="text-sm">{[parcelData.recipientAddress.address, parcelData.recipientAddress.province].join(", ")}</p>
                  </div>
                ) : <p className="text-black">-</p>}
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex-[2]">
                <p className="font-medium text-black text-base">Average Temperature</p>
                <div className="flex gap-3 mb-4 mt-2">
                  <div className="font-semibold text-xl">92 %</div>
                  <div className="text-sm flex flex-col justify-end">in range</div>
                </div>
                <div className="h-10 rounded-xl overflow-hidden bg-[#BB0701]">
                  <div className="h-full bg-[#16A34A]" style={{ width: "92%" }} />
                </div>
              </div>
            </div>

            {/* Graph Area */}
            <div className="bg-white rounded-xl shadow-md p-6 w-full h-96 flex flex-col">
              <p className="font-medium text-black text-base mb-3">Temperature During Transit</p>

              {hasTempData ? (
                <div className="flex flex-1 relative pt-4">
                  {/* Y-Axis Labels */}
                  <div className="w-16 h-full relative">
                    {yAxisLabels.map((item, index) => {
                      const percentageFromBottom = (item.posValue - absoluteMin) / totalTempRange;
                      const topPosition = 100 - percentageFromBottom * 100;
                      return (
                        <div key={index} className="absolute right-6 text-xs text-gray-400" style={{ top: `calc(${topPosition}% - 6px)` }}>
                          {item.display}
                        </div>
                      );
                    })}
                  </div>

                  {/* Graph Grid */}
                  <div className="flex-1 h-full relative  border-gray-200">
                    {yAxisLabels.map((item, index) => {
                        const percentageFromBottom = (item.posValue - absoluteMin) / totalTempRange;
                        const topPosition = 100 - percentageFromBottom * 100;
                        
                        // เช็คเส้น Max/Min เพื่อใช้สีเขียว
                        const isRangeLine = item.display === parseFloat(parcelData?.temperatureRangeMax!.toFixed(1)) ||
                                           item.display === parseFloat(parcelData?.temperatureRangeMin!.toFixed(1));

                        return (
                          <div key={index} className={`absolute left-0 right-0 border-t ${isRangeLine ? "border-[#16A34A] z-10" : "border-gray-200"}`} style={{ top: `${topPosition}%` }}></div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center items-center text-gray-500">Settings missing.</div>
              )}

              {/* X-Axis Labels */}
              <div className="flex justify-between w-full mt-4 pl-16">
                {timeLabels.map((time, index) => (
                  <div key={index} className="text-xs text-gray-400">{time}</div>
                ))}
              </div>
            </div>

            <div className="space-y-1 flex-1 flex flex-col mt-6">
            <div
              className="bg-white rounded-t-2xl shadow-sm flex flex-col flex-1 p-6"
            >
             
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;