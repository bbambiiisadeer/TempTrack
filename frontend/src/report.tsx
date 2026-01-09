import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { useAuth } from "./AuthContext";
import { useParcel } from "./ParcelContext";
import { useEffect, useMemo, useCallback } from "react";
import { filterSensorHistory } from './utils/sensorUtils';

const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const parts = dateString.split(" ");
  if (parts.length < 2) {
    if (dateString.includes("T")) {
      const [d, t] = dateString.split("T");
      const [y, m, day] = d.split("-");
      const finalYear = parseInt(y) > 2500 ? parseInt(y) - 543 : y;
      return `${day}-${m}-${finalYear} ${t.substring(0, 5)}`;
    }
    return dateString;
  }
  const [beYear, month, day] = parts[0].split("-");
  return `${day}-${month}-${parseInt(beYear) - 543} ${parts[1].substring(0, 5)}`;
};

const formatSensorTime = (dateString: string): string => {
  if (!dateString || dateString === "-") return "--:--";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
  });
};

function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { parcels, selectedParcel, setSelectedParcel, sensorHistory, drivers } = useParcel();

  useEffect(() => {
    const stateParcel = location.state?.parcel;
    if (stateParcel) {
      const freshData = parcels.find(p => p.trackingNo === stateParcel.trackingNo);
      setSelectedParcel(freshData || stateParcel);
    }
  }, [location.state, parcels, setSelectedParcel]);

  const displayParcel = useMemo(() => {
    if (!selectedParcel) return null;
    const driverInfo = drivers.find(d => d.id === selectedParcel.driverId);
    return {
      ...selectedParcel,
      driver: selectedParcel.driver || (driverInfo ? {
        name: driverInfo.name,
        regNumber: driverInfo.regNumber
      } : undefined)
    };
  }, [selectedParcel, drivers]);

  // ✅ ใช้ sensorHistory โดยตรง ไม่ต้องรอ
  const filteredHistory = useMemo(() => {
    if (!displayParcel?.shippedAt) return [];
    const history = sensorHistory[displayParcel.trackingNo] || [];
    
    console.log("=== DEBUG SENSOR DATA ===");
    console.log("trackingNo:", displayParcel.trackingNo);
    console.log("shippedAt:", displayParcel.shippedAt);
    console.log("deliveredAt:", displayParcel.deliveredAt);
    console.log("history length:", history.length);
    console.log("first 3 sensor data:", history.slice(0, 3));
    
    const filtered = filterSensorHistory(history, displayParcel);
    console.log("filtered length:", filtered.length);
    console.log("last sensor time:", filtered[0]?.timestamp);
    console.log("========================");
    
    return filtered;
  }, [sensorHistory, displayParcel]);

  const saveSensorDataToDatabase = useCallback(async () => {
    if (!displayParcel?.trackingNo || !displayParcel?.deliveredAt) {
      return;
    }

    if (filteredHistory.length === 0) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/parcel/save-sensor-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
        },
        body: JSON.stringify({
          trackingNo: displayParcel.trackingNo,
          sensorDataList: filteredHistory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save sensor data:", error);
      } else {
        const result = await response.json();
        if (result.alreadySaved) {
          console.log("Sensor data file already saved");
        } else {
          console.log(`Saved ${result.savedCount} sensor records to ${result.filePath}`);
        }
      }
    } catch (error) {
      console.error("Error saving sensor data:", error);
    }
  }, [displayParcel, filteredHistory]);

  useEffect(() => {
    if (displayParcel?.deliveredAt && filteredHistory.length > 0) {
      saveSensorDataToDatabase();
    }
  }, [displayParcel?.deliveredAt, displayParcel?.trackingNo, filteredHistory.length, saveSensorDataToDatabase]);

  const handleBack = () => {
    const path = location.state?.previousPath || "/sent";
    const status = location.state?.previousStatus || "all";
    navigate(path === "/sent" && status !== "all" ? `${path}?status=${status}` : path);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div className="bg-white rounded-l-full p-6 flex items-center justify-center w-20 hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleBack}>
                <button className="flex items-center justify-center w-12 h-12 rounded-full">
                  <IoArrowBackOutline className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
            <div className={`bg-white grid items-center px-8 ${user ? "rounded-r-full flex-1" : "rounded-full w-full pl-12"}`} style={{ gridTemplateColumns: "1.5fr 2.5fr 3fr 4fr 4fr 2.3fr" }}>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Reg num</div>
                <div className="text-2xl text-black font-medium">{displayParcel?.driver?.regNumber || "-"}</div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Driver</div>
                <div className="text-lg text-black font-medium">{displayParcel?.driver?.name || "-"}</div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Shipped At</div>
                <div className="text-lg text-black font-medium">{formatThaiDateTime(displayParcel?.shippedAt)}</div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">From</div>
                <div className="text-lg text-black font-medium overflow-hidden text-ellipsis whitespace-nowrap pr-4">{displayParcel?.senderAddress?.company || "-"}</div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">To</div>
                <div className="text-lg text-black font-medium overflow-hidden text-ellipsis whitespace-nowrap pr-4">{displayParcel?.recipientAddress?.company || "-"}</div>
              </div>
              <div className="flex flex-col h-full py-3 justify-between">
                <div className="text-sm text-gray-400">Tracking No.</div>
                <div className="text-lg text-black font-medium">{displayParcel?.trackingNo || "-"}</div>
              </div>
            </div>
          </div>
          <div className="space-y-1 flex-1 flex flex-col">
            <div className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 128px)" }}>
              <div className="border-b border-black flex items-center gap-24 px-10 py-6">
                <div className="w-30 text-base text-black font-medium">Time</div>
                <div className="w-60 text-base text-black font-medium">Temperature <span className="text-xs font-semibold">(°C)</span></div>
                <div className="w-36 text-base text-black font-medium ml-auto">Status</div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-md">
                    {!displayParcel?.shippedAt ? "Order not shipped yet" : "Waiting for sensor data"}
                  </div>
                ) : (
                  filteredHistory.map((data, index) => {
                    const min = displayParcel?.temperatureRangeMin ?? 0;
                    const max = displayParcel?.temperatureRangeMax ?? 35;
                    const isNormal = data.temp >= min && data.temp <= max;
                    return (
                      <div key={index} className="h-14 border-b border-gray-100 flex items-center gap-24 px-10 hover:bg-gray-50 transition-colors">
                        <div className="w-30 h-full flex items-center justify-start py-3">
                          <span className="text-sm">{formatSensorTime(data.timestamp)}</span>
                        </div>
                        <div className="w-60 h-full flex items-center justify-start py-3">
                          <span className="text-sm text-black">{data.temp?.toFixed(2)}</span>
                        </div>
                        <div className="h-full w-36 flex items-center justify-start py-3 ml-auto gap-4">
                          <div className={`w-3 h-3 rounded-full ${isNormal ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}></div>
                          <span className={`text-sm ${isNormal ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{isNormal ? "In Range" : "Out of Range"}</span>
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