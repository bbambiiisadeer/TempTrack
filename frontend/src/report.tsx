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
  deliveredAt?: string;
  temperatureRangeMin?: number;
  temperatureRangeMax?: number;
}

interface SensorData {
  temp: number;
  timestamp: string;
}

const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const parts = dateString.split(" ");
  if (parts.length < 2) {
      if(dateString.includes("T")) {
         const [d, t] = dateString.split("T");
         const [y, m, day] = d.split("-");
         const finalYear = parseInt(y) > 2500 ? parseInt(y) - 543 : y;
         return `${day}-${m}-${finalYear} ${t.substring(0, 5)}`;
      }
      return dateString; 
  }
  const datePart = parts[0]; 
  const timePart = parts[1]; 
  const [beYear, month, day] = datePart.split("-");
  const adYear = parseInt(beYear) - 543;
  const time = timePart.substring(0, 5);
  return `${day}-${month}-${adYear} ${time}`;
};

const formatSensorTime = (dateString: string): string => {
  if (!dateString || dateString === "-") return "--:--";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });
};

const getComparisonTimestamp = (dateStr: string | undefined) => {
    if (!dateStr) return 0;
    const cleanStr = dateStr.replace("Z", "").replace("T", " ");
    const match = cleanStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[\sT](\d{1,2}):(\d{1,2}):(\d{1,2})/);

    if (match) {
        let [_, y, m, d, h, min, s] = match;
        let year = parseInt(y);
        if (year > 2500) year -= 543;
        return Date.UTC(year, parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(s));
    }
    const fallbackDate = new Date(dateStr);
    return fallbackDate.getTime();
};

function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [previousFilterStatus, setPreviousFilterStatus] = useState("all");
  const [previousPath, setPreviousPath] = useState("/sent");
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);

  useEffect(() => {
    if (location.state?.parcel) {
      setParcelData(location.state.parcel);
    }
    if (location.state?.previousStatus) {
      setPreviousFilterStatus(location.state.previousStatus);
    }
    if (location.state?.previousPath) {
      setPreviousPath(location.state.previousPath);
    }
  }, [location]);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://13.214.139.223:3000/api/temp"); //change ip address here
        if (response.ok) {
          const dataHistory: SensorData[] = await response.json();
          setSensorHistory(dataHistory);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = sensorHistory.filter((data) => {
    if (!parcelData?.shippedAt) return false;

    const THAI_TIME_OFFSET = 7 * 60 * 60 * 1000;
    let sensorTime = getComparisonTimestamp(data.timestamp);
    
    if (data.timestamp.includes("Z")) {
        sensorTime += THAI_TIME_OFFSET;
    }

    const shippedTime = getComparisonTimestamp(parcelData.shippedAt);
    const isAfterShipping = sensorTime >= shippedTime;

    let isBeforeDelivery = true;
    
    if (parcelData.deliveredAt) {
      const deliveredTime = getComparisonTimestamp(parcelData.deliveredAt);
      isBeforeDelivery = sensorTime <= deliveredTime;
    }

    return isAfterShipping && isBeforeDelivery;
  });

  const handleBack = () => {
    if (previousPath === "/sent" && previousFilterStatus !== "all") {
      navigate(`${previousPath}?status=${previousFilterStatus}`);
    } else {
      navigate(previousPath);
    }
  };

  const displayStatus = parcelData?.deliveredAt ? "Shipped At" : "Shipped At";

  const displayTime = parcelData?.deliveredAt
    ? formatThaiDateTime(parcelData.shippedAt)
    : formatThaiDateTime(parcelData?.shippedAt);

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div
                className="bg-white rounded-l-full  p-6 flex items-center justify-center w-20 hover:bg-gray-50 transition-colors"
                onClick={handleBack}
              >
                <button className="flex items-center justify-center w-12 h-12 rounded-full">
                  <IoArrowBackOutline className="w-6 h-6 text-black" />
                </button>
              </div>
            )}

            <div
              className={`bg-white grid items-center px-8 
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

              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">{displayStatus}</div>
                <div className="text-lg text-black font-medium">
                  {displayTime}
                </div>
              </div>

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

          <div className="space-y-1 flex-1 flex flex-col">
            <div
              className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1 overflow-hidden"
              style={{ minHeight: "calc(100vh - 128px)" }}
            >
              <div className="border-b border-black flex items-center gap-24 px-10 py-6">
                <div className="w-30 text-base text-black font-medium">Time</div>
                <div className="w-60 text-base text-black font-medium">Temperature</div>
                <div className="w-36 text-base text-black font-medium ml-auto">Status</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-md">
                    {!parcelData?.shippedAt
                      ? "Order not shipped yet"
                      : "Waiting for sensor data"}
                  </div>
                ) : (
                  filteredHistory.map((data, index) => {
                    const minTemp = parcelData?.temperatureRangeMin ?? 0; 
                    const maxTemp = parcelData?.temperatureRangeMax ?? 35; 
                    
                    const isTempNormal = data.temp >= minTemp && data.temp <= maxTemp;

                    return (
                      <div
                        key={index}
                        className="h-14 border-b border-gray-100 flex items-center gap-24 px-10 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-30 h-full flex items-center justify-start py-3 gap-10">
                          <span className="text-sm">
                            {formatSensorTime(data.timestamp)}
                          </span>
                        </div>

                        <div className="w-60 h-full flex items-center justify-start py-3 gap-10">
                          <span
                            className={`text-sm ${
                              !isTempNormal ? "text-black" : "text-black"
                            }`}
                          >
                            {data.temp ? data.temp.toFixed(2) : "0.00"} °C
                          </span>
                        </div>

                        <div className="h-full w-36 flex items-center justify-start py-3 ml-auto gap-4">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isTempNormal ? "bg-[#16A34A]" : "bg-[#DC2626]"
                            }`}
                          ></div>
                          <span
                            className={`text-sm ${
                              isTempNormal ? "text-[#16A34A]" : "text-[#DC2626]"
                            }`}
                          >
                            {isTempNormal ? "In Range" : "Out of Range"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;