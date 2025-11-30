import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { useAuth } from "./AuthContext";
import { useTracking } from "./TrackingContext";
import { useNotification } from "./NotificationContext";
import { IoIosArrowDown } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { FaRegCircle, FaRegDotCircle, FaRegCheckCircle } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

interface DriverData {
  id: string;
  name: string;
  regNumber?: string;
  email?: string;
  phoneNumber?: string;
}

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  isShipped: boolean;
  createdAt: string;
  senderAddress?: {
    company?: string;
    name: string;
  };
  recipientAddress?: {
    company?: string;
    name: string;
  };
  driver?: DriverData;
}

interface NotificationData {
  id: string;
  parcelId: string;
  trackingNo: string;
  recipientCompany: string;
  driverName: string;
  driverRegNumber: string;
  shippedAt?: string;
  deliveredAt?: string;
  type: 'shipped' | 'delivered';
  isIncoming?: boolean;
  signature?: string;
  signedAt?: string;
  isRead?: boolean;
}

function SentPage() {
  const { user, logout, updateUser } = useAuth();
  const { trackingNumbers } = useTracking();
  const { isRead, isDeleted } = useNotification();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchParcels = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(
          `http://localhost:3000/parcel?userId=${user.id}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to fetch parcels");

        const data = await res.json();
        setParcels(data);
      } catch (err) {
        console.error("Error fetching parcels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, [user?.id]);

  // Fetch notifications to get unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      try {
        const sentRes = await fetch(
          `http://localhost:3000/parcel?userId=${user.id}`,
          {
            credentials: "include",
          }
        );

        if (!sentRes.ok) throw new Error("Failed to fetch parcels");

        const sentParcels = await sentRes.json();

        let incomingParcels: any[] = [];
        if (trackingNumbers.length > 0) {
          const promises = trackingNumbers.map(async (trackingNo) => {
            const formattedTrackingNo = trackingNo.startsWith("#")
              ? trackingNo
              : `#${trackingNo}`;
            try {
              const res = await fetch(
                `http://localhost:3000/parcel/track/${encodeURIComponent(
                  formattedTrackingNo
                )}`,
                {
                  credentials: "include",
                }
              );

              if (!res.ok) return null;
              const data = await res.json();
              return Array.isArray(data) ? data : [data];
            } catch {
              return null;
            }
          });

          const results = await Promise.all(promises);
          incomingParcels = results
            .filter((result): result is any[] => result !== null)
            .flat();
        }

        const allNotifications: NotificationData[] = [];

        sentParcels.forEach((p: any) => {
          if (p.isDelivered && p.deliveredAt) {
            allNotifications.push({
              id: `${p.id}-delivered`,
              parcelId: p.id,
              trackingNo: p.trackingNo,
              recipientCompany:
                p.recipientAddress?.company ||
                p.recipientAddress?.name ||
                "Unknown",
              driverName: p.driver?.name || "Unknown Driver",
              driverRegNumber: p.driver?.regNumber || "N/A",
              deliveredAt: p.deliveredAt,
              type: "delivered",
              isIncoming: false,
              isRead: false,
            });
          }

          if (p.isShipped && p.shippedAt) {
            allNotifications.push({
              id: `${p.id}-shipped`,
              parcelId: p.id,
              trackingNo: p.trackingNo,
              recipientCompany:
                p.recipientAddress?.company ||
                p.recipientAddress?.name ||
                "Unknown",
              driverName: p.driver?.name || "Unknown Driver",
              driverRegNumber: p.driver?.regNumber || "N/A",
              shippedAt: p.shippedAt,
              type: "shipped",
              isIncoming: false,
              isRead: false,
            });
          }
        });

        incomingParcels.forEach((p: any) => {
          if (p.isDelivered && p.deliveredAt) {
            allNotifications.push({
              id: `${p.id}-delivered-incoming`,
              parcelId: p.id,
              trackingNo: p.trackingNo,
              recipientCompany:
                p.recipientAddress?.company ||
                p.recipientAddress?.name ||
                "Unknown",
              driverName: p.driver?.name || "Unknown Driver",
              driverRegNumber: p.driver?.regNumber || "N/A",
              deliveredAt: p.deliveredAt,
              type: "delivered",
              isIncoming: true,
              signature: p.signature,
              signedAt: p.signedAt,
              isRead: false,
            });
          }

          if (p.isShipped && p.shippedAt) {
            allNotifications.push({
              id: `${p.id}-shipped-incoming`,
              parcelId: p.id,
              trackingNo: p.trackingNo,
              recipientCompany:
                p.recipientAddress?.company ||
                p.recipientAddress?.name ||
                "Unknown",
              driverName: p.driver?.name || "Unknown Driver",
              driverRegNumber: p.driver?.regNumber || "N/A",
              shippedAt: p.shippedAt,
              type: "shipped",
              isIncoming: true,
              isRead: false,
            });
          }
        });

        const activeNotifications = allNotifications.filter(n => !isDeleted(n.id));
        const unread = activeNotifications.filter(n => !isRead(n.id)).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [user?.id, trackingNumbers, isRead, isDeleted]);

  const filteredParcels = parcels
    .filter((p) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const dateStr = new Date(p.createdAt).toISOString().slice(0, 10);
      const statusStr = p.isDelivered ? "delivered" : "in transit";
      return (
        p.trackingNo.toLowerCase().includes(query) ||
        p.senderAddress?.company?.toLowerCase().includes(query) ||
        p.senderAddress?.name.toLowerCase().includes(query) ||
        p.recipientAddress?.company?.toLowerCase().includes(query) ||
        p.recipientAddress?.name.toLowerCase().includes(query) ||
        dateStr.includes(query) ||
        statusStr.includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return 0;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-CA");
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

  const handleCopyTracking = async (trackingNo: string) => {
    try {
      const numberOnly = trackingNo.replace(/[^0-9]/g, "");
      await navigator.clipboard.writeText(numberOnly);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex justify-between items-center px-8 border-b border-black">
        <Link to="/">
          <img
            src="/images/logo.png"
            alt="logo"
            className="h-7 object-contain cursor-pointer"
          />
        </Link>
        <div className="flex gap-26">
          <div
            className="border-b-3 bg-transparent font-semibold transition flex items-center h-20 px-2"
            onClick={() => navigate("/sent")}
          >
            Sent
          </div>
          <div
            className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2"
            onClick={() => navigate("/incoming")}
          >
            Incoming
          </div>
          <div
            className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2 relative"
            onClick={() => navigate("/notification")}
          >
            Notification
            {unreadCount > 0 && (
              <div className="absolute top-6 right-0 w-1.5 h-1.5 bg-[#DC2626] rounded-full"></div>
            )}
          </div>
          <div
            className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2"
            onClick={() => navigate("/address")}
          >
            Address
          </div>
        </div>

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
              <div className="px-1 py-1">
                <button
                  onClick={() => {
                    if (isEditingName) {
                      handleSaveName();
                    } else {
                      setIsEditingName(true);
                      setEditedName(user?.name || "");
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100 rounded-lg"
                >
                  {isEditingName ? "Save" : "Change Name"}
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-400">
          <div className="flex justify-between items-center px-8 py-6">
            <h2 className="text-2xl font-semibold text-black">Sent Parcels</h2>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-black mr-2">Sort by</span>
              <div className="relative inline-block w-34">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full bg-white border h-12 border-black text-black text-sm rounded-l-full px-4 pr-10 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="date">Date</option>
                  <option value="duration">Duration</option>
                  <option value="hightemp">High Temp</option>
                  <option value="lowtemp">Low Temp</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <IoIosArrowDown className="text-black w-4 h-4" />
                </div>
              </div>

              <div className="relative w-58">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-black rounded-r-full text-black text-sm px-4 py-2 h-12 w-full pr-10 focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <RxCross2 className="w-5 h-5" />
                  </button>
                ) : (
                  <IoSearch className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                )}
              </div>

              <button
                className="ml-4 flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm py-2 px-6 h-12 rounded-full"
                onClick={() => navigate("/senderinfo")}
              >
                <IoIosAdd className="text-2xl font-black -ml-1" />
                <span className="text-sm text-white">Add New Shipment</span>
              </button>
            </div>
          </div>

          <div className="px-8 space-y-1 flex-1 flex flex-col">
            <div
              className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1"
              style={{ minHeight: "calc(100vh - 178px)" }}
            >
              <div
                className="grid border-b border-black font-medium py-6 px-6 text-base text-black"
                style={{
                  gridTemplateColumns: "2.5fr 2fr 3fr 3fr 2fr 3fr 2fr",
                }}
              >
                <div className="pl-4">Tracking No.</div>
                <div className="pl-4">Date</div>
                <div className="pl-4">From</div>
                <div className="pl-4">To</div>
                <div className="pl-4">Duration</div>
                <div className="pl-4">Average Temp (°C)</div>
                <div className="pl-4">Status</div>
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500 text-md">Loading...</p>
                  </div>
                ) : filteredParcels.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500 text-md">No parcels found</p>
                  </div>
                ) : (
                  filteredParcels.map((parcel) => (
                    <div
                      key={parcel.id}
                      className="grid border-b border-gray-200 py-3 px-6 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate("/report", { state: { parcel } })}
                      style={{
                        gridTemplateColumns: "2.5fr 2fr 3fr 3fr 2fr 3fr 2fr",
                      }}
                    >
                      <div className="text-sm relative flex items-center gap-2 pl-4">
                        <span>{parcel.trackingNo}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTracking(parcel.trackingNo);
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <MdContentCopy className="w-4 h-4 text-black" />
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
                      <div className="pl-4">-</div>
                      <div className="pl-4">-</div>
                      {!parcel.isShipped && !parcel.isDelivered ? (
                        <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                          <FaRegCircle className="text-black w-4 h-4 mr-3" />
                          Pending
                        </div>
                      ) : parcel.isShipped && !parcel.isDelivered ? (
                        <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                          <FaRegDotCircle className="text-black w-4 h-4 mr-3" />
                          In transit
                        </div>
                      ) : (
                        <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                          <FaRegCheckCircle className="text-black w-4 h-4 mr-3" />
                          Delivered
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SentPage;