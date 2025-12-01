import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTracking } from "./TrackingContext";
import { useNotification } from "./NotificationContext";
import { IoSearch } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { LuClock4 } from "react-icons/lu";
import { RiEdit2Line } from "react-icons/ri";
import { FaCheck } from "react-icons/fa6";
import { RiDeleteBin4Line } from "react-icons/ri";
import { LuMailOpen } from "react-icons/lu";
import { TiMinus } from "react-icons/ti";
import { FaChevronDown } from "react-icons/fa6";

interface NotificationData {
  id: string;
  parcelId: string;
  trackingNo: string;
  recipientCompany: string;
  driverName: string;
  driverRegNumber: string;
  shippedAt?: string;
  deliveredAt?: string;
  type: "shipped" | "delivered";
  isIncoming?: boolean;
  signature?: string;
  signedAt?: string;
  isRead?: boolean;
}

type FilterType = "all" | "read" | "unread";

function Notification() {
  const { user, logout, updateUser } = useAuth();
  const { trackingNumbers } = useTracking();
  const {
    isRead,
    isDeleted,
    markAsRead: markAsReadContext,
    markAsDeleted,
  } = useNotification();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      try {
        // Fetch sent parcels
        const sentRes = await fetch(
          `http://localhost:3000/parcel?userId=${user.id}`,
          {
            credentials: "include",
          }
        );

        if (!sentRes.ok) throw new Error("Failed to fetch parcels");

        const sentParcels = await sentRes.json();

        // Fetch incoming parcels
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

        // Map all parcels to notifications
        const allNotifications: NotificationData[] = [];

        // Process sent parcels
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

        // Process incoming parcels
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

        // Sort by date (most recent first)
        allNotifications.sort((a, b) => {
          const dateA = new Date(a.deliveredAt || a.shippedAt || 0);
          const dateB = new Date(b.deliveredAt || b.shippedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setNotifications(allNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id, trackingNumbers]);

  // Filter out deleted notifications and apply read status from context
  const activeNotifications = notifications
    .filter((n) => !isDeleted(n.id))
    .map((n) => ({
      ...n,
      isRead: isRead(n.id),
    }));

  const filteredNotifications = activeNotifications.filter((n) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      n.trackingNo.toLowerCase().includes(query) ||
      n.recipientCompany.toLowerCase().includes(query) ||
      n.driverName.toLowerCase().includes(query) ||
      n.driverRegNumber.toLowerCase().includes(query)
    );
  });

  const unreadCount = activeNotifications.filter((n) => !n.isRead).length;

  const toggleNotificationSelect = (id: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size > 0) {
      // If any selected (including all or some), deselect all
      setSelectedNotifications(new Set());
      setFilterType("all"); // กลับไปเป็น "all" เพื่อให้สีกลับเป็นปกติ
    } else {
      // If none selected, select all
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const isAllSelected =
    selectedNotifications.size === filteredNotifications.length &&
    filteredNotifications.length > 0;
  const isSomeSelected =
    selectedNotifications.size > 0 &&
    selectedNotifications.size < filteredNotifications.length;

  const markAsRead = () => {
    if (selectedNotifications.size === 0) return;

    const allowedToRead = filteredNotifications
      .filter((n) => selectedNotifications.has(n.id))
      .filter((n) => !(n.isIncoming && n.type === "delivered" && !n.signature));

    if (allowedToRead.length === 0) return;

    markAsReadContext(allowedToRead.map((n) => n.id));
    setSelectedNotifications(new Set());
  };

  const deleteSelected = () => {
    if (selectedNotifications.size === 0) return;

    if (
      window.confirm(`Delete ${selectedNotifications.size} notification(s)?`)
    ) {
      markAsDeleted(Array.from(selectedNotifications));
      setSelectedNotifications(new Set());
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignatureDone = async () => {
    if (!selectedNotification) return;

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Check if canvas is empty
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const isEmpty = !imageData.data.some((channel) => channel !== 0);

      if (isEmpty) {
        alert("Please sign before submitting");
        return;
      }

      // Convert canvas to base64 image data
      const signatureData = canvas.toDataURL("image/png");

      // Save signature to backend
      const response = await fetch(
        `http://localhost:3000/parcel/${selectedNotification.parcelId}/signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ signature: signatureData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save signature");
      }

      // Update the notification in the local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === selectedNotification.id
            ? {
                ...n,
                signature: signatureData,
                signedAt: new Date().toISOString(),
              }
            : n
        )
      );

      setShowSignature(false);
      setSelectedNotification(null);
      clearCanvas();
    } catch (err) {
      console.error("Error saving signature:", err);
      alert("Failed to save signature");
    }
  };

  const openSignatureModal = (notification: NotificationData) => {
    setSelectedNotification(notification);
    setShowSignature(true);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsEditingName(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
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

  const getNotificationBackgroundColor = (notification: NotificationData) => {
    if (selectedNotifications.has(notification.id)) {
      if (filterType === "read" && notification.isRead) {
        return "bg-gray-100";
      }
      if (filterType === "unread" && !notification.isRead) {
        return "bg-gray-100";
      }
      if (filterType === "all") {
        return "bg-gray-100";
      }
    }
    return "bg-white";
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
            className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2"
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
            className="border-b-3 bg-transparent font-semibold transition flex items-center h-20 px-2 relative"
            onClick={() => navigate("/notification")}
          >
            Notification
            {unreadCount > 0 && (
              <div className="absolute top-4 right-0 w-2 h-2 bg-[#DC2626] rounded-full"></div>
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
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-semibold text-black">
                Notification
              </h2>

              <div className="relative" ref={filterRef}>
                <div
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-16 h-10 bg-transparent flex items-center justify-between px-2 rounded-xl cursor-pointer"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAll();
                    }}
                    className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${
                      isAllSelected
                        ? "bg-transparent border-black"
                        : isSomeSelected
                        ? "bg-transparent border-black"
                        : "border-black"
                    }`}
                  >
                    {isAllSelected && (
                      <FaCheck className="w-4 h-4 text-black" />
                    )}
                    {isSomeSelected && <TiMinus className="w-3" />}
                  </div>
                  <div className="p-2 rounded-full hover:bg-[#DAD8D3] transition-colors ml-4">
                    <FaChevronDown className="w-4 h-4 text-black" />{" "}
                  </div>
                </div>

                {isFilterOpen && (
                  <div className="absolute top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setIsFilterOpen(false);
                        // เลือกทั้งหมด
                        setSelectedNotifications(
                          new Set(filteredNotifications.map((n) => n.id))
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        filterType === "all" ? "font-semibold" : ""
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("read");
                        setIsFilterOpen(false);
                        // เลือกเฉพาะที่ read แล้ว
                        setSelectedNotifications(
                          new Set(
                            filteredNotifications
                              .filter((n) => n.isRead)
                              .map((n) => n.id)
                          )
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        filterType === "read" ? "font-semibold" : ""
                      }`}
                    >
                      Read
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("unread");
                        setIsFilterOpen(false);
                        // เลือกเฉพาะที่ยัง unread
                        setSelectedNotifications(
                          new Set(
                            filteredNotifications
                              .filter((n) => !n.isRead)
                              .map((n) => n.id)
                          )
                        );
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        filterType === "unread" ? "font-semibold" : ""
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                )}
              </div>

              {selectedNotifications.size > 0 && (
                <div className="flex items-center gap-4">
                  {filterType !== "read" && (
                    <button
                      onClick={markAsRead}
                      className="p-2 rounded-full hover:bg-[#DAD8D3] transition-colors"
                    >
                      <LuMailOpen size={22} />
                    </button>
                  )}
                  <button
                    onClick={deleteSelected}
                    className="p-2 rounded-full hover:bg-[#DAD8D3] transition-colors"
                  >
                    <RiDeleteBin4Line size={22} />
                  </button>
                  <span className="text-sm text-black">
                    {selectedNotifications.size} selected
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative w-78">
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
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <RxCross2 className="w-5 h-5" />
                  </button>
                ) : (
                  <IoSearch className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          <div className="px-8 space-y-1 flex-1 flex flex-col">
            <div
              className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1"
              style={{ minHeight: "calc(100vh - 178px)" }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 text-md">Loading...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 text-md">No notifications yet</p>
                </div>
              ) : (
                <div className="py-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-400 p-8 relative flex items-center gap-6 ${getNotificationBackgroundColor(
                        notification
                      )}`}
                    >
                      <div
                        onClick={() =>
                          toggleNotificationSelect(notification.id)
                        }
                        className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedNotifications.has(notification.id)
                            ? "bg-transparent border-black"
                            : "border-gray-400 hover:border-black"
                        }`}
                      >
                        {selectedNotifications.has(notification.id) && (
                          <FaCheck className="w-4 h-4 text-black" />
                        )}
                      </div>

                      <div className="flex justify-between items-start flex-1">
                        <div className="flex items-center gap-6 flex-1">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {notification.type === "delivered" ? (
                              <img
                                src="/images/box6.png"
                                alt="Delivered"
                                className="w-full object-cover"
                              />
                            ) : (
                              <img
                                src="/images/car.png"
                                alt="Shipped"
                                className="w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-black mb-1 ${
                                notification.isRead
                                  ? "font-normal"
                                  : "font-medium"
                              }`}
                            >
                              {notification.type === "delivered"
                                ? `Your parcel ${notification.trackingNo} has been delivered`
                                : `Your parcel ${notification.trackingNo} has been shipped`}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.type === "delivered"
                                ? `Your parcel was successfully delivered to ${notification.recipientCompany} by ${notification.driverName} (${notification.driverRegNumber})`
                                : `Your parcel is on the way to ${notification.recipientCompany} by ${notification.driverName} (${notification.driverRegNumber})`}
                            </p>
                            {notification.type === "delivered" &&
                              notification.isIncoming && (
                                <p
                                  className={`text-sm mt-2 ${
                                    notification.signature
                                      ? "text-gray-400"
                                      : "text-[#DC2626]"
                                  }`}
                                >
                                  {notification.signature
                                    ? "Signature received"
                                    : "Please click the right box and sign to accept parcel"}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                          <LuClock4 className="w-4 h-4" />
                          <span className="whitespace-nowrap">
                            {formatDateTime(
                              notification.deliveredAt ||
                                notification.shippedAt ||
                                ""
                            )}
                          </span>
                        </div>
                      </div>
                      {notification.type === "delivered" &&
                        notification.isIncoming && (
                          <button
                            onClick={() => openSignatureModal(notification)}
                            disabled={!!notification.signature}
                            className={`absolute bottom-8 right-4 w-8 h-8 flex items-center justify-center transition-colors mr-4 ${
                              notification.signature
                                ? "bg-black cursor-not-allowed rounded-full"
                                : "bg-black cursor-pointer rounded-md"
                            }`}
                            title={
                              notification.signature
                                ? "Already signed"
                                : "Sign to accept parcel"
                            }
                          >
                            {notification.signature ? (
                              <FaCheck className="w-4 h-4 text-white" />
                            ) : (
                              <RiEdit2Line className="w-5 h-5 text-white" />
                            )}
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-160 relative">
            <button
              onClick={() => {
                setShowSignature(false);
                setSelectedNotification(null);
                clearCanvas();
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
              <RxCross2 size={24} className="text-black" />
            </button>

            <h3 className="text-lg font-semibold text-black mb-1.5">
              Sign to Accept Parcel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tracking No: {selectedNotification?.trackingNo}
            </p>

            <div className="border-2 border-gray-300 rounded-lg bg-white mb-4">
              <canvas
                ref={canvasRef}
                width={552}
                height={300}
                className="cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            <div className="flex items-center justify-end mt-4">
              <button
                onClick={clearCanvas}
                className="text-black font-normal inter text-sm mr-8 bg-transparent border-none cursor-pointer hover:underline"
              >
                Clear
              </button>
              <button
                onClick={handleSignatureDone}
                className="bg-black text-sm hover:bg-gray-800 text-white py-2 px-6 rounded-full w-32 h-12"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notification;
