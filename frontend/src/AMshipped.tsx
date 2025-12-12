import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useParcel } from "./ParcelContext";
import { IoSearch } from "react-icons/io5";
import { MdContentCopy } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { BsCheckLg } from "react-icons/bs"; // <-- 1. นำเข้าไอคอน BsCheckLg

function AMshipped() {
  const { user, logout, updateUser } = useAuth();
  const {
    parcels,
    drivers,
    loading,
    totalPending,
    totalShipped,
    totalDelivered,
    setParcels,
  } = useParcel();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTrackingNo, setCopiedTrackingNo] = useState<string | null>(null); // <-- 2. เพิ่ม State สำหรับ Tracking No. ที่ถูกคัดลอก

  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const handleSaveName = async () => {
    try {
      if (!editedName.trim()) {
        alert("Name cannot be empty");
        return;
      }

      const res = await fetch(`http://localhost:3000/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: editedName }),
      });

      if (!res.ok) throw new Error("Failed to update name");

      updateUser({ name: editedName });
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update name");
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsEditingName(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // <-- 3. อัปเดตฟังก์ชัน handleCopyTracking
  const handleCopyTracking = async (trackingNo: string) => {
    try {
      const numberOnly = trackingNo.replace(/[^0-9]/g, "");
      await navigator.clipboard.writeText(numberOnly);
      
      setCopiedTrackingNo(trackingNo); 

      setTimeout(() => {
        setCopiedTrackingNo(null); 
      }, 800);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopiedTrackingNo(null);
    }
  };

  const handleToggleDelivered = async (
    parcelId: string,
    currentStatus: boolean
  ) => {
    try {
      const newStatus = !currentStatus;

      const res = await fetch(`http://localhost:3000/parcel/${parcelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isDelivered: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update delivered status");

      const responseData = await res.json();

      setParcels((prev) =>
        prev.map((p) =>
          p.id === parcelId
            ? {
                ...p,
                isDelivered: newStatus,
                deliveredAt: responseData.data.deliveredAt,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error updating delivered status:", err);
      alert("Failed to update delivered status");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-CA");
  };

  const filteredParcels = parcels
    .filter((p) => p.isShipped && !p.isDelivered)
    .filter((p) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const dateStr = new Date(p.createdAt).toISOString().slice(0, 10);
      const driver = drivers.find((d) => d.id === p.driverId);
      return (
        p.trackingNo.toLowerCase().includes(query) ||
        p.senderAddress?.company?.toLowerCase().includes(query) ||
        p.senderAddress?.name.toLowerCase().includes(query) ||
        p.recipientAddress?.company?.toLowerCase().includes(query) ||
        p.recipientAddress?.name.toLowerCase().includes(query) ||
        driver?.name.toLowerCase().includes(query) ||
        dateStr.includes(query)
      );
    });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-5">
        <h2 className="text-2xl font-semibold text-black">Dashboard</h2>
        <div className="relative" ref={menuRef}>
          <div
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-medium cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isEditingName
              ? editedName.trim()
                ? editedName.trim().charAt(0).toUpperCase()
                : firstLetter
              : firstLetter}
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-b-gray-300">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-medium">
                  {isEditingName
                    ? editedName.trim()
                      ? editedName.trim().charAt(0).toUpperCase()
                      : firstLetter
                    : firstLetter}
                </div>
                <div className="flex flex-col flex-1 min-h-[1.25rem] justify-center">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-sm font-medium text-black border-b border-gray-300 focus:outline-none focus:border-black w-full h-[1.25rem] leading-[1.25rem] px-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveName();
                        } else if (e.key === "Escape") {
                          setIsEditingName(false);
                          setEditedName("");
                        }
                      }}
                    />
                  ) : (
                    <p className="text-sm font-medium text-black h-[1.25rem] leading-[1.25rem]">
                      {user?.name || "No name"}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {user?.email || "No email"}
                  </p>
                </div>
              </div>
              <div className="">
                <button
                  onClick={() => {
                    if (isEditingName) {
                      handleSaveName();
                    } else {
                      setIsEditingName(true);
                      setEditedName(user?.name || "");
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100"
                >
                  {isEditingName ? "Save" : "Change Name"}
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100 "
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* White boxes */}
      <div className="flex justify-start gap-6 px-8">
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Total pending</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? (
              <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></span>
            ) : (
              totalPending
            )}
          </span>
          <span className="text-black text-sm mt-3">Waiting to be shipped</span>
        </div>
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Shipped</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? (
              <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></span>
            ) : (
              totalShipped
            )}
          </span>
          <span className="text-black text-sm mt-3">
            Has been dispatched and is on the way
          </span>
        </div>
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Delivered</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? (
              <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></span>
            ) : (
              totalDelivered
            )}
          </span>
          <span className="text-black text-sm mt-3">
            Successfully received by the recipient
          </span>
        </div>
      </div>

      <div className="flex justify-center px-8 flex-1">
        <div className="flex justify-center flex-1">
          <div className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1 mt-8">
            <div className="flex gap-8 mt-2 px-6">
              <div
                className="py-3.5 px-2 border border-transparent flex items-center justify-center text-sm text-gray-400 hover:font-medium transition cursor-pointer"
                onClick={() => navigate("/amdashboard")}
              >
                Pending
              </div>

              <div
                className="py-3.5 px-2 border-b-3 border-black flex items-center justify-center  font-semibold text-black cursor-pointer"
                onClick={() => navigate("/amshipped")}
              >
                Shipped
              </div>

              <div
                className="py-3.5 px-2 border border-transparent flex items-center justify-center text-sm text-gray-400 hover:font-medium transition cursor-pointer"
                onClick={() => navigate("/amdelivered")}
              >
                Delivered
              </div>

              <div
                className="py-3.5 px-2 border border-transparent flex items-center justify-center text-sm text-gray-400 hover:font-medium transition cursor-pointer"
                onClick={() => navigate("/amdriver")}
              >
                Driver
              </div>
            </div>
            <div className="w-full h-[1px] bg-gray-400"></div>
            <div className="relative w-88 mt-6 px-6">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-black rounded-full text-black text-sm px-4 py-2 h-12 w-full pr-10 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-11 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  <RxCross2 className="w-5 h-5" />
                </button>
              ) : (
                <IoSearch className="absolute right-11 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              )}
            </div>

            {/* Table Header */}
            <div
              className="grid border-b border-black font-medium py-6 text-base text-black mt-2"
              style={{
                gridTemplateColumns: "5fr 3fr 6fr 6fr 7fr 3fr",
              }}
            >
              <div className="pl-10">Tracking No.</div>
              <div className="pl-4">Date</div>
              <div className="pl-4">From</div>
              <div className="pl-4">To</div>
              <div className="pl-4">Driver</div>
              <div className="pl-4">Delivered</div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-auto pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 text-md"></p>
                </div>
              ) : filteredParcels.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 text-md">No parcels found</p>
                </div>
              ) : (
                filteredParcels.map((parcel) => {
                  return (
                    <div
                      key={parcel.id}
                      className="grid border-b border-gray-200 py-3 items-center h-15.5"
                      style={{
                        gridTemplateColumns: "5fr 3fr 6fr 6fr 7fr 3fr",
                      }}
                    >
                      <div className="text-sm relative flex items-center gap-2 pl-10">
                        <span>{parcel.trackingNo}</span>
                        <button
                          onClick={() => handleCopyTracking(parcel.trackingNo)}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {/* <-- 4. ใช้เงื่อนไขการสลับไอคอน */}
                          {copiedTrackingNo === parcel.trackingNo ? (
                            <BsCheckLg className="w-4 h-4 text-black" />
                          ) : (
                            <MdContentCopy className="w-4 h-4 text-black" />
                          )}
                        </button>
                      </div>
                      <div className="text-sm pl-4">
                        {formatDate(parcel.createdAt)}
                      </div>
                      <div className="text-sm pl-4">
                        {parcel.senderAddress?.company ||
                          parcel.senderAddress?.name ||
                          "-"}
                      </div>
                      <div className="text-sm pl-4">
                        {parcel.recipientAddress?.company ||
                          parcel.recipientAddress?.name ||
                          "-"}
                      </div>
                      <div className="pl-4">
                        <div className="flex items-center gap-2">
                          {parcel.driverId &&
                            drivers.find((d) => d.id === parcel.driverId)
                              ?.imageUrl && (
                              <img
                                src={
                                  drivers.find((d) => d.id === parcel.driverId)
                                    ?.imageUrl
                                }
                                alt="Driver"
                                className="w-8 h-8 rounded-full object-cover border border-gray-300"
                              />
                            )}
                          <span className="text-sm text-black">
                            {drivers.find((d) => d.id === parcel.driverId)
                              ?.name || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="pl-4">
                        <button
                          onClick={() =>
                            handleToggleDelivered(parcel.id, parcel.isDelivered)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            parcel.isDelivered
                              ? "bg-black"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              parcel.isDelivered
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
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
  );
}

export default AMshipped;