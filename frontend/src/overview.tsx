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

          <div className="space-y-4">
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

            <div className="flex gap-4 w-full h-50">
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

                        <span className=" text-sm font-normal text-gray-400">
                          {parcelData.recipientAddress.phoneNumber || "-"}
                        </span>
                      </p>
                    </div>

                    {parcelData.recipientAddress.company && (
                      <p className=" text-sm  text-black">
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
                  {/* กล่อง A */}
                  <div className="font-semibold text-black text-xl">92 %</div>

                  {/* กล่อง B */}
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
                className="bg-white rounded-xl shadow-md p-6 w-full"
                style={{ height: "240px" }}
              >
                <p className="text-gray-500">Row 3: Single Box (h-60)</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 flex-1 flex flex-col mt-4">
            {" "}
            <div
              className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1 p-6"
              style={{ minHeight: "calc(100vh - 128px - 400px)" }}
            >
              <h3 className="text-xl font-semibold">
                Large White Box (Main Content)
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
