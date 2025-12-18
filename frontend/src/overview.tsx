import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaRegCheckCircle } from "react-icons/fa";
import { useAuth } from "./AuthContext";
import { useEffect, useState, useMemo } from "react";
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
  deliveredAt?: string;
  signature?: string;
  temperatureRangeMin?: number;
  temperatureRangeMax?: number;
}

interface SensorData {
  temp: number;
  timestamp: string;
}

interface YAxisLevel {
  display: number;
  posValue: number;
  isBoundary: boolean;
}

// --- Helper Functions ---

const getComparisonTimestamp = (dateStr: string | undefined): number => {
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

const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const parts = dateString.split(" ");
  if (parts.length < 2) {
    if (dateString.includes("T")) {
      const [d, t] = dateString.split("T");
      const [y, m, day] = d.split("-");
      const year = parseInt(y);
      const finalYear = year > 2500 ? year - 543 : year;
      const time = t.substring(0, 5);
      return `${day}-${m}-${finalYear} ${time}`;
    }
    return dateString;
  }
  const datePart = parts[0];
  const timePart = parts[1];
  const [beYear, month, day] = datePart.split("-");
  const year = parseInt(beYear);
  const adYear = year > 2500 ? year - 543 : year;
  const time = timePart.substring(0, 5);
  return `${day}-${month}-${adYear} ${time}`;
};

const formatTimeLabel = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatTimeForXAxis = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const generateTimeLabels = (shippedAt: string, deliveredAt: string): string[] => {
  const startTime = getComparisonTimestamp(shippedAt);
  const endTime = getComparisonTimestamp(deliveredAt);
  if (startTime === 0 || endTime === 0) return [];
  
  // แบ่งช่วงเวลาเป็น 12 ช่วง เพื่อให้ได้จุดข้อมูล 13 จุด (Index 0 ถึง 12)
  const timeInterval = (endTime - startTime) / 12;
  const labels: string[] = [];
  for (let i = 0; i < 13; i++) {
    const pointTime = startTime + (timeInterval * i);
    labels.push(formatTimeForXAxis(pointTime));
  }
  return labels;
};

const generateYAxisLabels = (min: number, max: number, history: SensorData[]) => {
  const dataTemps = history.map(d => d.temp);
  const dataMin = dataTemps.length > 0 ? Math.min(...dataTemps) : min;
  const dataMax = dataTemps.length > 0 ? Math.max(...dataTemps) : max;

  const step = (max - min) / 5 || 1;
  let finalTop: number;
  let finalBottom: number;
  const rawLevels: YAxisLevel[] = [];

  rawLevels.push({ display: parseFloat(max.toFixed(1)), posValue: max, isBoundary: true });
  rawLevels.push({ display: parseFloat(min.toFixed(1)), posValue: min, isBoundary: true });

  if (dataMax <= max && dataMin >= min) {
    finalTop = max + step;
    finalBottom = min - step;
    rawLevels.push({ display: parseFloat(finalTop.toFixed(1)), posValue: finalTop, isBoundary: false });
    rawLevels.push({ display: parseFloat(finalBottom.toFixed(1)), posValue: finalBottom, isBoundary: false });
  } else if (dataMax <= max && dataMin < min) {
    finalTop = max;
    finalBottom = Math.floor(dataMin);
    rawLevels.push({ display: finalBottom, posValue: finalBottom, isBoundary: false });
  } else if (dataMax > max && dataMin >= min) {
    finalTop = Math.ceil(dataMax);
    finalBottom = min;
    rawLevels.push({ display: finalTop, posValue: finalTop, isBoundary: false });
  } else {
    finalTop = Math.ceil(dataMax);
    finalBottom = Math.floor(dataMin);
    rawLevels.push({ display: finalTop, posValue: finalTop, isBoundary: false });
    rawLevels.push({ display: finalBottom, posValue: finalBottom, isBoundary: false });
  }

  const absoluteMin = finalBottom - (step * 0.1);
  const absoluteMax = finalTop + (step * 0.1);

  const yAxisLabels = Array.from(new Map(rawLevels.map(item => [item.display, item])).values())
    .sort((a, b) => b.posValue - a.posValue);

  return { yAxisLabels, absoluteMin, absoluteMax };
};

// --- Main Component ---

function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [previousFilterStatus, setPreviousFilterStatus] = useState("all");
  const [previousPath, setPreviousPath] = useState("/sent");
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; temp: number; time: string } | null>(null);

  const THAI_TIME_OFFSET = 7 * 60 * 60 * 1000;

  useEffect(() => {
    if (location.state?.parcel) setParcelData(location.state.parcel);
    if (location.state?.previousStatus) setPreviousFilterStatus(location.state.previousStatus);
    if (location.state?.previousPath) setPreviousPath(location.state.previousPath);
  }, [location]);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://13.214.139.175:3000/api/temp");
        if (response.ok) {
          const dataHistory: SensorData[] = await response.json();
          setSensorHistory(dataHistory);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = useMemo(() => {
    return sensorHistory.filter((data) => {
      if (!parcelData?.shippedAt || !parcelData?.deliveredAt) return false;
      let sensorTime = getComparisonTimestamp(data.timestamp);
      if (data.timestamp.includes("Z")) sensorTime += THAI_TIME_OFFSET;
      const shippedTime = getComparisonTimestamp(parcelData.shippedAt);
      const deliveredTime = getComparisonTimestamp(parcelData.deliveredAt);
      return sensorTime >= shippedTime && sensorTime <= deliveredTime;
    });
  }, [sensorHistory, parcelData, THAI_TIME_OFFSET]);

  const hasTempData =
    parcelData?.temperatureRangeMin !== undefined &&
    parcelData?.temperatureRangeMax !== undefined;

  const { yAxisLabels, absoluteMin, absoluteMax } = useMemo(() => {
    if (hasTempData) {
      return generateYAxisLabels(
        parcelData!.temperatureRangeMin!,
        parcelData!.temperatureRangeMax!,
        filteredHistory
      );
    }
    return { yAxisLabels: [] as YAxisLevel[], absoluteMin: 0, absoluteMax: 0 };
  }, [parcelData, filteredHistory, hasTempData]);

  const totalTempRange = (absoluteMax - absoluteMin) || 1;

  const handleBack = () => {
    if (previousPath === "/sent" && previousFilterStatus !== "all") {
      navigate(`${previousPath}?status=${previousFilterStatus}`);
    } else {
      navigate(previousPath);
    }
  };

  const timeLabels = useMemo(() => {
    return parcelData?.shippedAt && parcelData?.deliveredAt
      ? generateTimeLabels(parcelData.shippedAt, parcelData.deliveredAt)
      : [];
  }, [parcelData?.shippedAt, parcelData?.deliveredAt]);

  const graphPoints = useMemo(() => {
    return filteredHistory.map((data) => {
      const timestamp = getComparisonTimestamp(data.timestamp);
      const adjustedTimestamp = data.timestamp.includes("Z") ? timestamp + THAI_TIME_OFFSET : timestamp;
      const shippedTime = getComparisonTimestamp(parcelData?.shippedAt);
      const deliveredTime = getComparisonTimestamp(parcelData?.deliveredAt);
      const totalDuration = (deliveredTime - shippedTime) || 1;
      const elapsed = adjustedTimestamp - shippedTime;
      
      const xPercent = (elapsed / totalDuration) * 100;
      const yPercent = ((data.temp - absoluteMin) / totalTempRange) * 100;
      
      return { 
        x: Math.max(0, Math.min(100, xPercent)), 
        y: 100 - yPercent, 
        temp: data.temp,
        time: formatTimeLabel(adjustedTimestamp)
      };
    });
  }, [filteredHistory, parcelData, absoluteMin, totalTempRange, THAI_TIME_OFFSET]);

  const graphPath = graphPoints.length > 0
    ? graphPoints.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ')
    : '';

  const inRangeCount = filteredHistory.filter(d => 
    d.temp >= (parcelData?.temperatureRangeMin ?? 0) && 
    d.temp <= (parcelData?.temperatureRangeMax ?? 35)
  ).length;
  
  const inRangePercent = filteredHistory.length > 0 
    ? Math.round((inRangeCount / filteredHistory.length) * 100)
    : 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          {/* Header */}
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div
                className="bg-white rounded-l-full p-6 flex items-center justify-center w-20 hover:bg-gray-50 cursor-pointer"
                onClick={handleBack}
              >
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
            {/* Timeline Stepper */}
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
                <p className="text-xs text-gray-500">{formatThaiDateTime(parcelData?.deliveredAt)}</p>
              </div>
            </div>

            {/* Boxes Info */}
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
                  <div className="font-semibold text-xl">{inRangePercent} %</div>
                  <div className="text-sm flex flex-col justify-end">in range</div>
                </div>
                <div className="h-10 rounded-xl overflow-hidden bg-[#BB0701]">
                  <div className="h-full bg-[#16A34A]" style={{ width: `${inRangePercent}%` }} />
                </div>
              </div>
            </div>

            {/* Temperature Graph */}
            <div className="bg-white rounded-xl shadow-md p-6 w-full h-96 flex flex-col">
              <p className="font-medium text-black text-base mb-3">Temperature During Transit</p>

              {hasTempData ? (
                <div className="flex flex-1 relative pt-6 -ml-2">
                  {/* Y-Axis Labels */}
                  <div className="w-16 h-full relative">
                    {yAxisLabels.map((item: YAxisLevel, index: number) => {
                      const percentageFromBottom = (item.posValue - absoluteMin) / totalTempRange;
                      const topPosition = 100 - percentageFromBottom * 100;
                      return (
                        <div key={index} className="absolute right-6 text-xs text-gray-400" style={{ top: `calc(${topPosition}% - 6px)` }}>
                          {item.display}
                        </div>
                      );
                    })}
                  </div>

                  {/* Graph Area */}
                  <div className="flex-1 h-full relative border-gray-200 mr-3.5">
                    {yAxisLabels.map((item: YAxisLevel, index: number) => {
                      const percentageFromBottom = (item.posValue - absoluteMin) / totalTempRange;
                      const topPosition = 100 - percentageFromBottom * 100;
                      const isRangeLine = item.display === parseFloat(parcelData?.temperatureRangeMax!.toFixed(1)) ||
                                         item.display === parseFloat(parcelData?.temperatureRangeMin!.toFixed(1));
                      return (
                        <div key={index} className={`absolute left-0 right-0 border-t ${isRangeLine ? "border-[#16A34A]/60 z-10" : "border-gray-200"}`} style={{ top: `${topPosition}%` }}></div>
                      );
                    })}

                    <svg 
                      className="absolute inset-0 w-full h-full" 
                      viewBox="0 0 100 100" 
                      preserveAspectRatio="none"
                      onMouseMove={(e) => {
                        const svg = e.currentTarget;
                        const rect = svg.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        let closestPoint = null;
                        let minDistance = Infinity;
                        graphPoints.forEach(point => {
                          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                          if (distance < minDistance && distance < 5) {
                            minDistance = distance;
                            closestPoint = point;
                          }
                        });
                        setHoveredPoint(closestPoint);
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <g>
                        <path d={graphPath} fill="none" stroke="black" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                        
                        {hoveredPoint && (
                          <>
                            <line x1={hoveredPoint.x} y1="0" x2={hoveredPoint.x} y2="100" stroke="#BDBDBD" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                            <line x1="0" y1={hoveredPoint.y} x2="100" y2={hoveredPoint.y} stroke="#BDBDBD" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                          </>
                        )}
                      </g>
                    </svg>

                    {hoveredPoint && (
                      <div 
                        className="absolute bg-gray-200 text-black text-xs px-3 py-2 rounded-lg pointer-events-none z-20 shadow-sm"
                        style={{
                          left: `${hoveredPoint.x}%`,
                          top: `${hoveredPoint.y}%`,
                          transform: 'translate(-50%, -120%)'
                        }}
                      >
                        <div>{hoveredPoint.temp.toFixed(2)} °C, {hoveredPoint.time}</div>
                      </div>
                    )}
                    {graphPoints.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No temperature data available</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center items-center text-gray-500">Settings missing.</div>
              )}

              {/* X-Axis Labels Section */}
              <div className="relative mt-6 ml-14 mr-3.5 h-6">
                <div className="flex justify-between w-full absolute inset-0">
                  {timeLabels.map((time, index) => (
                    <div 
                      key={index} 
                      className="text-[10px] text-gray-400 whitespace-nowrap flex flex-col items-center"
                      style={{ 
                        width: '0px', 
                        overflow: 'visible',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ 
                        position: 'relative', 
                        left: index === 0 ? '5px' : index === 12 ? '-5px' : '0' 
                      }}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Temperature Table */}
            <div className="space-y-1 flex-1 flex flex-col mt-6">
              <div className="bg-white rounded-t-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
                <div className="border-b border-black flex items-center gap-24 px-10 py-6">
                  <div className="w-30 text-base text-black font-medium">Time</div>
                  <div className="w-60 text-base text-black font-medium">Temperature (°C)</div>
                  <div className="w-36 text-base text-black font-medium ml-auto">Status</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-md">
                      {!parcelData?.shippedAt ? "Order not shipped yet" : "Waiting for sensor data"}
                    </div>
                  ) : (
                    [...filteredHistory].reverse().map((data, index) => {
                      const minTemp = parcelData?.temperatureRangeMin ?? 0;
                      const maxTemp = parcelData?.temperatureRangeMax ?? 35;
                      const isTempNormal = data.temp >= minTemp && data.temp <= maxTemp;
                      return (
                        <div key={index} className="h-14 border-b border-gray-100 flex items-center gap-24 px-10 hover:bg-gray-50 transition-colors">
                          <div className="w-30 h-full flex items-center justify-start py-3">
                            <span className="text-sm">
                              {formatTimeLabel(getComparisonTimestamp(data.timestamp) + (data.timestamp.includes("Z") ? THAI_TIME_OFFSET : 0))}
                            </span>
                          </div>
                          <div className="w-60 h-full flex items-center justify-start py-3">
                            <span className="text-sm text-black">{data.temp ? data.temp.toFixed(2) : "-"}</span>
                          </div>
                          <div className="h-full w-36 flex items-center justify-start py-3 ml-auto gap-4">
                            <div className={`w-2.5 h-2.5 rounded-full ${isTempNormal ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}></div>
                            <span className={`text-sm font-medium ${isTempNormal ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{isTempNormal ? "In Range" : "Out of Range"}</span>
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
    </div>
  );
}

export default Overview;