import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaRegCheckCircle } from "react-icons/fa";
import { useAuth } from "./AuthContext";
import { useParcel } from "./ParcelContext";
import { useEffect, useState, useMemo, useRef } from "react";
import { type Address } from "./types";

// --- Interfaces ---
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

// --- Components & Helpers ---

const GaugeChart = ({ percent = 0 }) => {
  const width = 220;
  const radius = 80;
  const strokeWidth = 15;
  const height = radius + strokeWidth + 10;

  const cx = width / 2;
  const cy = height - 5;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const getCoords = (angle: number) => {
    return {
      x: cx + radius * Math.cos(toRad(angle)),
      y: cy + radius * Math.sin(toRad(angle)),
    };
  };

  const startAngle = 180;
  const endAngle = 360;
  const currentAngle = startAngle + (percent / 100) * (endAngle - startAngle);

  const bgStart = getCoords(startAngle);
  const bgEnd = getCoords(endAngle);
  const progressEnd = getCoords(currentAngle);

  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${bgEnd.x} ${bgEnd.y}`;
  const progressPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${progressEnd.x} ${progressEnd.y}`;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <path
          d={bgPath}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {percent > 0 && (
          <path
            d={progressPath}
            fill="none"
            stroke="#16A34A"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute bottom-2 text-center translate-y-2">
        <div className="text-2xl font-bold text-black">{percent}%</div>
        <div className="text-xs text-black">matched</div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin mb-2"></div>
    <span className="text-xs text-gray-400">verifying</span>
  </div>
);

const getComparisonTimestamp = (dateStr: string | undefined): number => {
  if (!dateStr) return 0;
  const cleanStr = dateStr.replace("Z", "").replace("T", " ");

  const timestamp = Date.parse(cleanStr);
  if (!isNaN(timestamp)) return timestamp;

  const match = cleanStr.match(
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})[\sT](\d{1,2}):(\d{1,2}):(\d{1,2})/
  );

  if (match) {
    let [_, d, m, y, h, min, s] = match;
    let year = parseInt(y);
    if (year > 2500) year -= 543;
    return new Date(
      year,
      parseInt(m) - 1,
      parseInt(d),
      parseInt(h),
      parseInt(min),
      parseInt(s)
    ).getTime();
  }

  const matchISO = cleanStr.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})[\sT](\d{1,2}):(\d{1,2}):(\d{1,2})/
  );
  if (matchISO) {
    let [_, y, m, d, h, min, s] = matchISO;
    let year = parseInt(y);
    if (year > 2500) year -= 543;
    return new Date(
      year,
      parseInt(m) - 1,
      parseInt(d),
      parseInt(h),
      parseInt(min),
      parseInt(s)
    ).getTime();
  }

  return 0;
};

const parseApiTimestamp = (dateStr: string) => {
  if (!dateStr) return 0;
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart || !timePart) return 0;

  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min, s] = timePart.split(":").map(Number);

  return new Date(y, m - 1, d, h, min, s).getTime();
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

  let year = parseInt(beYear);
  let d = day;
  let m = month;

  if (year < 100) {
    d = beYear;
    m = month;
    year = parseInt(day);
  }

  const adYear = year > 2500 ? year - 543 : year;
  const time = timePart.substring(0, 5);
  return `${d}-${m}-${adYear} ${time}`;
};

const formatTimeLabel = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

const generateYAxisLabels = (
  settingMin: number,
  settingMax: number,
  history: SensorData[]
) => {
  const dataTemps = history.map((d) => d.temp);
  const realDataMin =
    dataTemps.length > 0 ? Math.min(...dataTemps) : settingMin;
  const realDataMax =
    dataTemps.length > 0 ? Math.max(...dataTemps) : settingMax;

  const overallMin = Math.min(settingMin, realDataMin);
  const overallMax = Math.max(settingMax, realDataMax);
  const range = overallMax - overallMin || 1;

  const padding = range * 0.15;

  const finalTop = overallMax + padding;
  const finalBottom = overallMin - padding;

  const rawLevels: YAxisLevel[] = [];

  rawLevels.push({
    display: parseFloat(settingMax.toFixed(1)),
    posValue: settingMax,
    isBoundary: true,
  });
  rawLevels.push({
    display: parseFloat(settingMin.toFixed(1)),
    posValue: settingMin,
    isBoundary: true,
  });

  rawLevels.push({
    display: parseFloat(finalTop.toFixed(1)),
    posValue: finalTop,
    isBoundary: false,
  });
  rawLevels.push({
    display: parseFloat(finalBottom.toFixed(1)),
    posValue: finalBottom,
    isBoundary: false,
  });

  const uniqueLevels = Array.from(
    new Map(rawLevels.map((item) => [item.display, item])).values()
  ).sort((a, b) => b.posValue - a.posValue);

  return {
    yAxisLabels: uniqueLevels,
    absoluteMin: finalBottom,
    absoluteMax: finalTop,
  };
};

// --- Main Component ---

function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { sensorHistory, parcels } = useParcel();

  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [previousFilterStatus, setPreviousFilterStatus] = useState("all");
  const [previousPath, setPreviousPath] = useState("/sent");
  const [blockchainMatchPercent, setBlockchainMatchPercent] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    temp: number;
    time: string;
  } | null>(null);

  // 🔒 ใช้ useRef เพื่อป้องกันการโหลดซ้ำ
  const loadedTrackingNo = useRef<string | null>(null);

  useEffect(() => {
    const stateParcel = location.state?.parcel as ParcelData | undefined;
    if (!stateParcel) return;

    const currentTrackingNo = stateParcel.trackingNo;

    // 🔒 ถ้าเคยโหลด tracking number นี้แล้ว ไม่ต้องทำอะไร
    if (loadedTrackingNo.current === currentTrackingNo) {
      return;
    }

    // 🔓 ล็อก tracking number นี้ว่าโหลดแล้ว
    loadedTrackingNo.current = currentTrackingNo;

    // 1. หาข้อมูลล่าสุดจาก Context
    const freshParcel = parcels.find(
      (p: any) => p.trackingNo === currentTrackingNo
    ) as any;

    // 2. ดึงลายเซ็นมาเตรียมไว้
    const currentSignature = freshParcel?.signature || stateParcel.signature;

    // 3. รวมข้อมูล (Merge) และ Set ครั้งเดียว
    const mergedData = {
      ...stateParcel,
      ...freshParcel,
      signature: currentSignature,
    };

    setParcelData(mergedData);

    // 4. ถ้าไม่มี signature ให้ Fetch
    if (!currentSignature && currentTrackingNo) {
      fetch(`http://localhost:3000/parcel/track/${encodeURIComponent(currentTrackingNo)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: any) => {
          if (data?.signature) {
            setParcelData((prev: any) => ({
              ...prev,
              signature: data.signature,
            }));
          }
        })
        .catch((err) => console.log("Failed to fetch signature:", err));
    }

    // 5. จัดการเรื่อง Navigation Path
    if (location.state?.previousStatus) {
      setPreviousFilterStatus(location.state.previousStatus);
    }
    if (location.state?.previousPath) {
      setPreviousPath(location.state.previousPath);
    }
  }, [location.state?.parcel?.trackingNo, parcels]);

  const filteredHistory = useMemo(() => {
    if (!parcelData?.trackingNo || !parcelData?.shippedAt) return [];

    const rawHistory = sensorHistory[parcelData.trackingNo] || [];
    const shippedTime = getComparisonTimestamp(parcelData.shippedAt);
    const deliveredTime = parcelData.deliveredAt
      ? getComparisonTimestamp(parcelData.deliveredAt)
      : Date.now();

    return rawHistory
      .filter((data) => {
        const sensorTime = getComparisonTimestamp(data.timestamp);
        return sensorTime >= shippedTime && sensorTime <= deliveredTime;
      })
      .sort(
        (a, b) =>
          getComparisonTimestamp(a.timestamp) -
          getComparisonTimestamp(b.timestamp)
      );
  }, [sensorHistory, parcelData]);

  const { graphStartTime, graphEndTime } = useMemo(() => {
    if (filteredHistory.length > 0) {
      const firstTime = getComparisonTimestamp(filteredHistory[0].timestamp);
      const lastTime = getComparisonTimestamp(
        filteredHistory[filteredHistory.length - 1].timestamp
      );
      return {
        graphStartTime: firstTime,
        graphEndTime: firstTime === lastTime ? lastTime + 1000 : lastTime,
      };
    }
    const start = parcelData?.shippedAt
      ? getComparisonTimestamp(parcelData.shippedAt)
      : 0;
    const end = parcelData?.deliveredAt
      ? getComparisonTimestamp(parcelData.deliveredAt)
      : Date.now();
    return { graphStartTime: start, graphEndTime: end };
  }, [filteredHistory, parcelData]);

  useEffect(() => {
    const verifyBlockchainData = async () => {
      if (!parcelData?.trackingNo || filteredHistory.length === 0) return;

      const cacheKey = `blockchain_percent_${parcelData.trackingNo}`;
      const cachedPercent = localStorage.getItem(cacheKey);

      if (cachedPercent !== null) {
        setBlockchainMatchPercent(Number(cachedPercent));
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);
      const startTime = Date.now(); // 🔴 เก็บเวลาเริ่มต้น

      try {
        const response = await fetch("http://13.229.150.123:3000/api/history");
        if (!response.ok) throw new Error("Failed to fetch blockchain history");

        const apiData: any[] = await response.json();

        let matchCount = 0;
        const THAI_OFFSET = 7 * 60 * 60 * 1000;

        filteredHistory.forEach((localItem) => {
          const localTime = getComparisonTimestamp(localItem.timestamp);
          const localTemp = Number(localItem.temp);

          const isMatch = apiData.some((apiItem) => {
            const apiTime = parseApiTimestamp(apiItem.timestamp);
            const apiTemp = Number(apiItem.temp);

            const isTempMatch = Math.abs(localTemp - apiTemp) < 0.1;
            if (!isTempMatch) return false;

            const diff = localTime - apiTime;
            const tolerance = 2 * 60 * 1000;

            const isExactMatch = Math.abs(diff) < tolerance;
            const isUtcVsThai = Math.abs(diff + THAI_OFFSET) < tolerance;
            const isThaiVsUtc = Math.abs(diff - THAI_OFFSET) < tolerance;

            return isExactMatch || isUtcVsThai || isThaiVsUtc;
          });

          if (isMatch) matchCount++;
        });

        const percent =
          filteredHistory.length > 0
            ? Math.floor((matchCount / filteredHistory.length) * 100)
            : 0;

        // 🔴 คำนวณเวลาที่เหลือเพื่อให้ครบ 8 วินาที
        const elapsedTime = Date.now() - startTime;
        const minDelay = 1000; // 8 seconds
        const remainingTime = Math.max(0, minDelay - elapsedTime);

        // 🔴 รอให้ครบ 8 วินาทีก่อนแสดงผล
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        localStorage.setItem(cacheKey, percent.toString());
        setBlockchainMatchPercent(percent);
      } catch (error) {
        console.error("Error verifying blockchain data:", error);
        
        // 🔴 ถ้า error ก็ยังคงรออย่างน้อย 8 วินาที
        const elapsedTime = Date.now() - startTime;
        const minDelay = 1000;
        const remainingTime = Math.max(0, minDelay - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        setBlockchainMatchPercent(0);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyBlockchainData();
  }, [filteredHistory, parcelData?.trackingNo]);

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
    return {
      yAxisLabels: [] as YAxisLevel[],
      absoluteMin: 0,
      absoluteMax: 100,
    };
  }, [parcelData, filteredHistory, hasTempData]);

  const totalTempRange = absoluteMax - absoluteMin || 1;

  const handleBack = () => {
    if (previousPath === "/sent" && previousFilterStatus !== "all") {
      navigate(`${previousPath}?status=${previousFilterStatus}`);
    } else {
      navigate(previousPath);
    }
  };

  const timeLabels = useMemo(() => {
    if (!graphStartTime || !graphEndTime) return [];

    const diff = graphEndTime - graphStartTime;
    const isMoreThanOneDay = diff > 24 * 60 * 60 * 1000;

    const format = (ts: number) => {
      const date = new Date(ts);
      const h = String(date.getHours()).padStart(2, "0");
      const m = String(date.getMinutes()).padStart(2, "0");

      if (isMoreThanOneDay) {
        const d = date.getDate();
        const month = date.getMonth() + 1;
        return `${d}/${month} ${h}:${m}`;
      } else {
        const s = String(date.getSeconds()).padStart(2, "0");
        return `${h}:${m}:${s}`;
      }
    };

    return [format(graphStartTime), format(graphEndTime)];
  }, [graphStartTime, graphEndTime]);

  const graphPoints = useMemo(() => {
    if (!graphStartTime || filteredHistory.length === 0) return [];

    const totalDuration = graphEndTime - graphStartTime || 1;

    return filteredHistory.map((data) => {
      let sensorTime = getComparisonTimestamp(data.timestamp);
      
      const elapsed = Math.max(0, sensorTime - graphStartTime);

      const xPercent = (elapsed / totalDuration) * 100;
      const yPercent = ((data.temp - absoluteMin) / totalTempRange) * 100;

      if (data.timestamp.includes("Z")) {
        sensorTime += 7 * 60 * 60 * 1000;
      }

      return {
        x: Math.max(0, Math.min(100, xPercent)),
        y: 100 - yPercent,
        temp: data.temp,
        time: formatTimeLabel(sensorTime),
      };
    });
  }, [filteredHistory, graphStartTime, graphEndTime, absoluteMin, totalTempRange]);

  const graphPath =
    graphPoints.length > 0
      ? graphPoints
          .map(
            (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
          )
          .join(" ")
      : "";

  const inRangeCount = filteredHistory.filter(
    (d) =>
      d.temp >= (parcelData?.temperatureRangeMin ?? 0) &&
      d.temp <= (parcelData?.temperatureRangeMax ?? 35)
  ).length;

  const outOfRangePercent =
    filteredHistory.length > 0
      ? Math.round(
          100-((filteredHistory.length - inRangeCount) / filteredHistory.length) *
            100
        )
      : 0;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          {/* Header Section */}
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
            <div
              className={`bg-white flex items-center justify-between px-8 ${
                user ? "rounded-r-full flex-1" : "rounded-full w-full pl-12"
              }`}
            >
              <h2 className="text-2xl font-semibold text-black">Overview</h2>
              <div className="flex items-center h-full py-3">
                <div className="text-sm text-gray-400 mr-4">Tracking No.</div>
                <div className="text-lg text-black font-medium">
                  {parcelData?.trackingNo || "-"}
                </div>
                <span className="text-2xl text-black font-light mx-4 mr-2">
                  |
                </span>
                <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                  <FaRegCheckCircle className="text-black w-4 h-4 mr-3" />{" "}
                  Delivered
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white rounded-xl shadow-md p-6 w-full h-40 flex justify-center items-center gap-4">
              <div className="flex flex-col items-center">
                <img
                  src="/images/signupBox.png"
                  className="h-10"
                  alt="pending"
                />
                <p className="font-medium text-black text-sm mt-3">Pending</p>
                <p className="text-xs text-gray-500">
                  {formatThaiDateTime(parcelData?.createdAt)}
                </p>
              </div>
              <div className="w-30 h-0.5 bg-black"></div>
              <div className="flex flex-col items-center">
                <img
                  src="/images/deliveredCar.png"
                  className="h-10"
                  alt="shipped"
                />
                <p className="font-medium text-black text-sm mt-3">Shipped</p>
                <p className="text-xs text-gray-500">
                  {formatThaiDateTime(parcelData?.shippedAt)}
                </p>
              </div>
              <div className="w-30 h-0.5 bg-black"></div>
              <div className="flex flex-col items-center">
                <img
                  src="/images/signinBox.png"
                  className="h-10"
                  alt="delivered"
                />
                <p className="font-medium text-black text-sm mt-3">Delivered</p>
                <p className="text-xs text-gray-500">
                  {formatThaiDateTime(parcelData?.deliveredAt)}
                </p>
              </div>
            </div>

            {/* Info Row */}
            <div className="flex gap-8 w-full h-48">
              <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                <p className="font-medium text-black text-base">
                  Proof of Delivery
                </p>
                {parcelData?.signature ? (
                  <img
                    src={parcelData.signature}
                    alt="Signature"
                    className="mt-6 w-full h-24 object-contain rounded"
                  />
                ) : (
                  <div className="mt-6 w-full h-24 flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                    No signature available
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex-1 text-sm">
                <p className="font-medium text-black text-base mb-3">
                  Shipping Address
                </p>
                {parcelData?.recipientAddress ? (
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      {parcelData.recipientAddress.name}
                      <span className="border-l border-gray-400 h-4"></span>
                      <span className="text-gray-400 text-sm font-normal">
                        {parcelData.recipientAddress.phoneNumber}
                      </span>
                    </p>
                    <p>{parcelData.recipientAddress.company}</p>
                    <p className="text-sm">
                      {[
                        parcelData.recipientAddress.address,
                        parcelData.recipientAddress.province,
                      ].join(", ")}
                    </p>
                  </div>
                ) : (
                  <p className="text-black">-</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 flex-[2] flex flex-col justify-between">
                <p className="font-medium text-black text-base mb-2">
                  Blockchain Verified
                </p>
                <div className="flex-1 flex items-center justify-center pb-2">
                  {isVerifying ? (
                    <LoadingSpinner />
                  ) : (
                    <GaugeChart percent={blockchainMatchPercent} />
                  )}
                </div>
              </div>
            </div>

            {/* Main Temperature Graph */}
            <div className="bg-white rounded-xl shadow-md p-6 w-full h-96 flex flex-col">
              <div className="flex items-baseline gap-3 mb-4">
                <p className="font-medium text-black text-base">
                  Temperature During Transit
                </p>
                <div className="font-semibold text-xl ml-2">
                  {outOfRangePercent} %
                </div>
                <div className="text-sm">in range</div>
              </div>

              {hasTempData ? (
                <div className="flex flex-1 relative pt-6 -ml-2">
                  <div className="w-16 h-full relative">
                    {yAxisLabels.map((item: YAxisLevel, index: number) => {
                      const percentageFromBottom =
                        (item.posValue - absoluteMin) / totalTempRange;
                      const topPosition = 100 - percentageFromBottom * 100;
                      return (
                        <div
                          key={index}
                          className={`absolute right-6 text-xs ${
                            item.isBoundary
                              ? "text-[#16A34A] font-medium"
                              : "text-gray-400"
                          }`}
                          style={{ top: `calc(${topPosition}% - 6px)` }}
                        >
                          {item.display}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-1 h-full relative border-gray-200 mr-3.5">
                    {yAxisLabels.map((item: YAxisLevel, index: number) => {
                      const percentageFromBottom =
                        (item.posValue - absoluteMin) / totalTempRange;
                      const topPosition = 100 - percentageFromBottom * 100;
                      const isRangeLine =
                        Math.abs(
                          item.posValue - parcelData!.temperatureRangeMax!
                        ) < 0.01 ||
                        Math.abs(
                          item.posValue - parcelData!.temperatureRangeMin!
                        ) < 0.01;
                      return (
                        <div
                          key={index}
                          className={`absolute left-0 right-0 border-t ${
                            isRangeLine
                              ? "border-[#16A34A]/60 z-10"
                              : "border-gray-200"
                          }`}
                          style={{ top: `${topPosition}%` }}
                        ></div>
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
                        graphPoints.forEach((point) => {
                          const distance = Math.sqrt(
                            Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                          );
                          if (distance < minDistance && distance < 5) {
                            minDistance = distance;
                            closestPoint = point;
                          }
                        });
                        setHoveredPoint(closestPoint);
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <path
                        d={graphPath}
                        fill="none"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />

                      {hoveredPoint && (
                        <>
                          <line
                            x1={hoveredPoint.x}
                            y1="0"
                            x2={hoveredPoint.x}
                            y2="100"
                            stroke="#BDBDBD"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                          />
                          <line
                            x1="0"
                            y1={hoveredPoint.y}
                            x2="100"
                            y2={hoveredPoint.y}
                            stroke="#BDBDBD"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      )}
                    </svg>

                    {hoveredPoint && (
                      <div
                        className="absolute bg-gray-200 text-black text-xs px-3 py-2 rounded-lg pointer-events-none z-20 shadow-sm"
                        style={{
                          left: `${hoveredPoint.x}%`,
                          top: `${hoveredPoint.y}%`,
                          transform: "translate(-50%, -120%)",
                        }}
                      >
                        <div>
                          {hoveredPoint.temp.toFixed(2)} °C, {hoveredPoint.time}
                        </div>
                      </div>
                    )}
                    {graphPoints.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No temperature data available
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center items-center text-gray-500">
                  Settings missing.
                </div>
              )}

              <div className="relative mt-6 ml-14 mr-3.5 h-6">
                <div className="flex justify-between w-full absolute inset-0">
                  {timeLabels.map((time, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-400 whitespace-nowrap flex flex-col items-center"
                      style={{
                        width: "0px",
                        overflow: "visible",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          transform:
                            index === 0
                              ? "translateX(50%)"
                              : "translateX(-50%)",
                        }}
                      >
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="space-y-1 flex-1 flex flex-col mt-6">
              <div className="bg-white rounded-t-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
                <div className="border-b border-black flex items-center gap-24 px-10 py-6">
                  <div className="w-30 text-base text-black font-medium">
                    Time
                  </div>
                  <div className="w-60 text-base text-black font-medium">
                    Temperature (°C)
                  </div>
                  <div className="w-36 text-base text-black font-medium ml-auto">
                    Status
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-md">
                      {!parcelData?.shippedAt
                        ? "Order not shipped yet"
                        : "Waiting for sensor data"}
                    </div>
                  ) : (
                    [...filteredHistory].reverse().map((data, index) => {
                      const minTemp = parcelData?.temperatureRangeMin ?? 0;
                      const maxTemp = parcelData?.temperatureRangeMax ?? 35;
                      const isTempNormal =
                        data.temp >= minTemp && data.temp <= maxTemp;
                      return (
                        <div
                          key={index}
                          className="h-14 border-b border-gray-100 flex items-center gap-24 px-10 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-30 h-full flex items-center justify-start py-3">
                            <span className="text-sm">
                              {formatTimeLabel(
                                getComparisonTimestamp(data.timestamp) +
                                  (data.timestamp.includes("Z")
                                    ? 7 * 60 * 60 * 1000
                                    : 0)
                              )}
                            </span>
                          </div>
                          <div className="w-60 h-full flex items-center justify-start py-3">
                            <span className="text-sm text-black">
                              {data.temp ? data.temp.toFixed(2) : "-"}
                            </span>
                          </div>
                          <div className="h-full w-36 flex items-center justify-start py-3 ml-auto gap-4">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                isTempNormal ? "bg-[#16A34A]" : "bg-[#DC2626]"
                              }`}
                            ></div>
                            <span
                              className={`text-sm font-medium ${
                                isTempNormal
                                  ? "text-[#16A34A]"
                                  : "text-[#DC2626]"
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
    </div>
  );
}

export default Overview;