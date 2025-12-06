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
  allowedDeviation?: number;
}

const formatThaiDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);

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

const generateYAxisLabels = (
  min: number,
  max: number,
  deviation: number | undefined
): { labels: number[], absoluteMin: number, absoluteMax: number } => {
  const range = max - min;
  const step = range > 0 ? range / 4 : 1;
  const finalLabels: number[] = [];
  
  const useDeviation = deviation !== undefined && deviation > 0;

  if (useDeviation) {
    // 1. Max + 1S
    finalLabels.push(max + step * 1); 
    // 2. Max + Deviation
    finalLabels.push(max + deviation!);
  } else {
    // 1. Max + 2S
    finalLabels.push(max + step * 2);
    // 2. Max + 1S
    finalLabels.push(max + step * 1);
  }

  // 3. Max
  finalLabels.push(max);

  // 4. Max - 1 * Step
  finalLabels.push(max - step * 1);

  // 5. Max - 2 * Step
  finalLabels.push(max - step * 2);

  // 6. Max - 3 * Step
  finalLabels.push(max - step * 3);

  // 7. Min
  finalLabels.push(min);

  if (useDeviation) {
    // 8. Min - Deviation
    finalLabels.push(min - deviation!);
    // 9. Min - 1S
    finalLabels.push(min - step * 1);
  } else {
    // 8. Min - 1S
    finalLabels.push(min - step * 1);
    // 9. Min - 2S
    finalLabels.push(min - step * 2);
  }
  
  const sortedLabels = finalLabels
    .map(n => parseFloat(n.toFixed(1)))
    .sort((a, b) => a - b);
  
  const absoluteMin = sortedLabels[0];
  const absoluteMax = sortedLabels[sortedLabels.length - 1];

  return { labels: sortedLabels, absoluteMin, absoluteMax };
};

function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);

  const [previousFilterStatus, setPreviousFilterStatus] = useState("all");

  const [previousPath, setPreviousPath] = useState("/sent");

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

  const handleBack = () => {
    if (previousPath === "/sent" && previousFilterStatus !== "all") {
      navigate(`${previousPath}?status=${previousFilterStatus}`);
    } else {
      navigate(previousPath);
    }
  };

  const hasTempData = parcelData?.temperatureRangeMin !== undefined && 
                      parcelData?.temperatureRangeMax !== undefined;

  const tempRangeData = hasTempData 
    ? generateYAxisLabels(
        parcelData.temperatureRangeMin!, 
        parcelData.temperatureRangeMax!, 
        parcelData.allowedDeviation 
      ) 
    : { labels: [], absoluteMin: 0, absoluteMax: 0 };

  const { labels: yAxisLabels, absoluteMin, absoluteMax } = tempRangeData;
  const totalTempRange = absoluteMax - absoluteMin;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex items-center justify-center pt-8">
        <div className="w-full max-w-400 px-8">
          <div className="flex gap-4 mb-4 h-20">
            {user && (
              <div
                className="bg-white rounded-l-full p-6 flex items-center justify-center w-20 hover:bg-gray-50 transition-colors"
                onClick={handleBack}
              >
                <button className="flex items-center justify-center w-12 h-12 rounded-full">
                  <IoArrowBackOutline className="w-6 h-6 text-black" />
                </button>
              </div>
            )}

            <div
              className={`bg-white items-center px-8
                ${user ? "rounded-r-full flex-1" : "rounded-full w-full pl-12"}
              `}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
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
                  <FaRegCheckCircle className="text-black w-4 h-4 mr-3" />
                  Delivered
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex w-full">
              <div className="bg-white rounded-xl shadow-md p-6 w-full h-40">
                <div className="flex justify-center items-center gap-4 h-full">
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                    <img src="/images/signupBox.png" className="h-10" />
                    <div className="text-center">
                      <p className="font-medium text-black text-sm mt-3">
                        Pending
                      </p>
                      <p className="text-sm text-black mt-1">
                        {" "}
                        {formatThaiDateTime(parcelData?.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="w-30 h-0.5 bg-black"></div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg ">
                    <img src="/images/deliveredCar.png" className="h-10" />
                    <div className="text-center">
                      <p className="font-medium text-black text-sm mt-3">
                        Shipped
                      </p>
                      <p className="text-sm text-black mt-1">
                        {" "}
                        {formatThaiDateTime(parcelData?.shippedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="w-30 h-0.5 bg-black"></div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg">
                    <img src="/images/signinBox.png" className="h-10" />
                    <div className="text-center">
                      <p className="font-medium text-black text-sm mt-3">
                        Delivered
                      </p>
                      <p className="text-sm text-black mt-1">
                        {" "}
                        {formatThaiDateTime(parcelData?.signedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8 w-full h-48">
              <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                <p className="font-medium text-black text-base">
                  Proof of Delivery
                </p>
                <img
                  src={`${parcelData?.signature}`}
                  alt="Signature"
                  className="mt-6 w-full h-24 object-contain rounded"
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                <p className="font-medium text-black text-base mb-3">
                  Shipping Address
                </p>

                {parcelData?.recipientAddress ? (
                  <div className="text-sm text-black space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-md  flex items-center  gap-2">
                        {parcelData.recipientAddress.name}

                        <span className="border-l-[1.5px] border-gray-400 h-4"></span>

                        <span className=" text-sm  text-gray-400">
                          {parcelData.recipientAddress.phoneNumber || "-"}
                        </span>
                      </p>
                    </div>

                    {parcelData.recipientAddress.company && (
                      <p className=" text-sm font-medium text-black">
                        {parcelData.recipientAddress.company}
                      </p>
                    )}

                    <p className=" text-sm  text-black">
                      {[
                        parcelData.recipientAddress.address,
                        parcelData.recipientAddress.subdistrict,
                        parcelData.recipientAddress.district,
                        parcelData.recipientAddress.province,
                        parcelData.recipientAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">-</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex-[2]">
                <p className="font-medium text-black text-base">
                  Average Temperature
                </p>

                <div className="flex gap-3 mb-4 mt-2">
                  <div className="font-semibold text-black text-xl">92 %</div>

                  <div className=" text-black text-sm flex flex-col justify-end">
                    in the allowed temperature range
                  </div>
                </div>
                <div className="h-12 rounded-xl overflow-hidden flex bg-[#BB0701]">
                  <div
                    className="h-full"
                    style={{
                      width: "92%",
                      backgroundColor: "#16A34A",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full">
              <div
                className="bg-white rounded-xl shadow-md p-6 w-full h-90 flex flex-col"
              >
                <p className="font-medium text-black text-base mb-3">
                  Temperature During Transit
                </p>
                
                {hasTempData && yAxisLabels.length === 9 && totalTempRange > 0 ? (
                    <div className="flex flex-1 relative pt-2">
                        {/* Y-Axis Labels (ซ้าย) */}
                        <div className="w-12 h-full text-xs text-gray-400 relative">
                            {yAxisLabels.slice().reverse().map((temp, index) => {
                                const percentageFromBottom = (temp - absoluteMin) / totalTempRange;
                                const topPosition = 100 - (percentageFromBottom * 100);

                                return (
                                    <div 
                                        key={index} 
                                        className="absolute right-4.5 w-full text-right leading-none"
                                        style={{ top: `calc(${topPosition}% - 0.5em)` }}
                                    >
                                        {temp}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Graph Grid Area (ตรงกลาง) */}
                        <div className="flex-1 h-full relative ">
                            {yAxisLabels.map((temp, index) => {
                                let lineColor = 'border-none';
                                let isDashed = false;
                                
                                const hasDeviation = parcelData!.allowedDeviation !== undefined && parcelData!.allowedDeviation > 0;

                                if (temp === parcelData!.temperatureRangeMin) {
                                    lineColor = 'border-[#16A34A]';
                                    isDashed = false;
                                } else if (temp === parcelData!.temperatureRangeMax) {
                                    lineColor = 'border-[#16A34A]';
                                    isDashed = false;
                                } 
                                else if (hasDeviation && 
                                         (temp === (parcelData!.temperatureRangeMin! - parcelData!.allowedDeviation!) || 
                                          temp === (parcelData!.temperatureRangeMax! + parcelData!.allowedDeviation!))) {
                                    lineColor = 'border-gray-300';
                                    isDashed = true;
                                }
                                
                                const percentageFromBottom = (temp - absoluteMin) / totalTempRange;
                                const topPosition = 100 - (percentageFromBottom * 100);
                                
                                let finalLineColor = lineColor;
                                if (isDashed && lineColor !== 'border-none') {
                                     finalLineColor = `${lineColor} border-solid`;
                                } else if (lineColor !== 'border-none') {
                                     finalLineColor = `${lineColor} border-solid`;
                                }

                                return (
                                    <div 
                                        key={`grid-${index}`}
                                        className={`absolute left-0 right-0 ${finalLineColor}`}
                                        style={{ top: `${topPosition}%`, borderTopWidth: lineColor === 'border-none' ? '0' : '1px' }}
                                    ></div>
                                );
                            })}
                            
                            <div className="relative h-full w-full">
                                <div className="absolute inset-0 flex justify-center items-center text-gray-400 text-lg">
                                    {/* [Data Line Chart Area] */}
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 justify-center items-center text-gray-500">
                        Temperature range settings are missing.
                    </div>
                )}
                
                {/* X-Axis Labels (ด้านล่าง) */}
                <div className="flex justify-between w-full h-4 mt-3  pl-12">
                    {Array.from({ length: 13 }, (_, i) => String.fromCharCode(97 + i)).map((char) => (
                        <div 
                            key={char} 
                            className="text-xs text-gray-400"
                        >
                            {char}
                        </div>
                    ))}
                </div>
              </div>
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
  );
}

export default Overview;