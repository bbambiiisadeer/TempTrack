import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import { useAuth } from "./AuthContext";
import { useParcel } from "./ParcelContext";
import { useTracking } from "./TrackingContext";
import { useNotification } from "./NotificationContext";
import { IoIosArrowDown } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { FaRegCircle, FaRegDotCircle, FaRegCheckCircle } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { BsCheckLg } from "react-icons/bs";
import { getComparisonTimestamp, filterSensorHistory } from './utils/sensorUtils';

const STATUS_OPTIONS = [
    { label: "All Status", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "In transit", value: "in_transit" },
    { label: "Delivered", value: "delivered" },
];

function IncomingPage() {
  const { user, logout, updateUser } = useAuth();
  const { parcels: contextParcels, sensorHistory, setSelectedParcel } = useParcel();
  const { trackingNumbers } = useTracking();
  const { unreadCount } = useNotification();
  const navigate = useNavigate(); 
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTrackingNo, setCopiedTrackingNo] = useState<string | null>(null);  
  const [filterStatus, setFilterStatus] = useState("all");  
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [temperatureData, setTemperatureData] = useState<Record<string, number>>({});

  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    if (statusParam && STATUS_OPTIONS.some(opt => opt.value === statusParam)) {
        setFilterStatus(statusParam);
    }
  }, [location.search]);



 useEffect(() => {
  if (contextParcels.length === 0) return;
  
  const calculateTemperatures = () => {
    const tempMap: Record<string, number> = {};
    
    contextParcels.forEach((parcel) => {
      if (parcel.isDelivered && parcel.shippedAt && parcel.deliveredAt) {
        const history = sensorHistory[parcel.trackingNo] || [];
        
        // ใช้ function ที่แก้แล้ว
        const filtered = filterSensorHistory(history, parcel);
        
        if (filtered.length > 0) {
          const avg = filtered.reduce((sum, d) => sum + d.temp, 0) / filtered.length;
          tempMap[parcel.id] = Math.round(avg * 10) / 10;
        }
      }
    });
    
    setTemperatureData(tempMap);
  };
  
  calculateTemperatures();
}, [contextParcels, sensorHistory]);


  const getStatusKey = (parcel: any): string => {
    if (parcel.isDelivered && parcel.signedAt) return "delivered";
    if (parcel.isShipped && !parcel.isDelivered) return "in_transit";
    if (!parcel.isShipped && !parcel.isDelivered) return "pending";
    return "in_transit";
  };

  const calculateDuration = (shippedAt?: string, deliveredAt?: string): string => {
    if (!shippedAt || !deliveredAt) return "-";
    const start = getComparisonTimestamp(shippedAt);
    const end = getComparisonTimestamp(deliveredAt);
    const diffMs = end - start;
    if (diffMs < 0) return "-";
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(diffMinutes / (60 * 24));
    const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
    const minutes = diffMinutes % 60;
    if (days > 0) return `${days}d ${hours}hr ${minutes}m`;
    if (hours > 0) return `${hours}hr ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredParcels = useMemo(() => {
    const userParcels = contextParcels.filter(p => 
      trackingNumbers.includes(p.trackingNo) || trackingNumbers.includes(p.trackingNo.replace('#', ''))
    );
    return userParcels.filter((p) => {
      const statusKey = getStatusKey(p);
      if (filterStatus !== 'all' && statusKey !== filterStatus) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.trackingNo.toLowerCase().includes(query) ||
        p.senderAddress?.company?.toLowerCase().includes(query) ||
        p.recipientAddress?.company?.toLowerCase().includes(query)
      );
    });
  }, [contextParcels, trackingNumbers, filterStatus, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsEditingName(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
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
        headers: { "Content-Type": "application/json" },
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
      await navigator.clipboard.writeText(trackingNo.replace(/[^0-9]/g, ""));
      setCopiedTrackingNo(trackingNo);  
      setTimeout(() => setCopiedTrackingNo(null), 800);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (parcel: any) => {
    setSelectedParcel(parcel);
    const navigationState = { parcel, previousPath: '/incoming', previousStatus: filterStatus };
    if (getStatusKey(parcel) === 'delivered') {
      navigate(`/overview?trackingNo=${parcel.trackingNo}`, { state: navigationState });
    } else {
      navigate("/report", { state: navigationState });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
      <div className="flex justify-between items-center px-8 border-b border-black">
        <Link to="/"><img src="/images/logo.png" alt="logo" className="h-7 object-contain cursor-pointer" /></Link>
        <div className="flex gap-26">
          <div className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2 cursor-pointer" onClick={() => navigate("/sent")}>Sent</div>
          <div className="border-b-3 bg-transparent font-semibold transition flex items-center h-20 px-2 cursor-pointer" onClick={() => navigate("/incoming")}>Incoming</div>
          <div className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2 relative cursor-pointer" onClick={() => navigate("/notification")}>
            Notification {unreadCount > 0 && <div className="absolute top-6 right-0 w-1.5 h-1.5 bg-[#DC2626] rounded-full"></div>}
          </div>
          <div className="border-transparent bg-transparent text-sm hover:font-medium transition flex items-center h-20 px-2 cursor-pointer" onClick={() => navigate("/address")}>Address</div>
        </div>
        <div className="relative" ref={menuRef}>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-medium cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>{firstLetter}</div>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-b-gray-300">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-medium">{firstLetter}</div>
                <div className="flex flex-col flex-1 min-h-[1.25rem] justify-center">
                  {isEditingName ? (
                    <input ref={nameInputRef} type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-sm font-medium text-black border-b border-gray-300 focus:outline-none focus:border-black w-full" onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }} />
                  ) : (
                    <p className="text-sm font-medium text-black">{user?.name || "No name"}</p>
                  )}
                  <p className="text-sm text-gray-600">{user?.email || "No email"}</p>
                </div>
              </div>
              <button onClick={() => { if (isEditingName) handleSaveName(); else { setIsEditingName(true); setEditedName(user?.name || ""); } }} className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100">{isEditingName ? "Save" : "Change Name"}</button>
              <button onClick={() => { logout(); navigate("/"); }} className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100">Logout</button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="w-400">
          <div className="flex justify-between items-center px-8 py-6">
            <h2 className="text-2xl font-semibold text-black">Incoming Parcels</h2>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-black mr-2">Status</span>  
              <div className="relative inline-block w-34" ref={sortMenuRef}>
                <button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} className="appearance-none w-full bg-white border h-12 border-black text-black text-sm rounded-l-full px-4 flex items-center justify-between">
                  {STATUS_OPTIONS.find(opt => opt.value === filterStatus)?.label}
                  <IoIosArrowDown className={`transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusMenuOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {STATUS_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => { setFilterStatus(opt.value); setIsStatusMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === opt.value ? "bg-gray-100" : ""}`}>{opt.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-58">
                <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-black rounded-r-full text-black text-sm px-4 py-2 h-12 w-full pr-10 focus:outline-none" />
                {searchQuery ? <RxCross2 onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" /> : <IoSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />}
              </div>
              <button className="ml-4 bg-black hover:bg-gray-800 text-white text-sm px-6 h-12 rounded-full font-medium" onClick={() => navigate("/trackstatus")}>Check Track Status</button>
            </div>
          </div>
          <div className="px-8 space-y-1 flex-1 flex flex-col">
            <div className="bg-white rounded-t-2xl shadow-md flex flex-col flex-1" style={{ minHeight: "calc(100vh - 178px)" }}>
              <div className="grid border-b border-black font-medium py-6 px-6 text-base text-black" style={{ gridTemplateColumns: "2.5fr 2fr 3fr 3fr 2fr 3fr 2fr" }}>
                <div className="pl-4">Tracking No.</div><div className="pl-4">Date</div><div className="pl-4">From</div><div className="pl-4">To</div><div className="pl-4">Duration</div><div className="pl-4">Average Temp (°C)</div><div className="pl-4">Status</div>
              </div>
              <div className="flex-1 overflow-auto">
                {filteredParcels.length === 0 ? (
                  <div className="flex items-center justify-center py-8"><p className="text-gray-500 text-md">No parcels found</p></div>
                ) : (
                  filteredParcels.map((parcel) => {
                    const sk = getStatusKey(parcel);
                    return (
                      <div key={parcel.id} className="grid border-b border-gray-200 py-3 px-6 items-center cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(parcel)} style={{ gridTemplateColumns: "2.5fr 2fr 3fr 3fr 2fr 3fr 2fr" }}>
                        <div className="text-sm flex items-center gap-2 pl-4">
                          <span>{parcel.trackingNo}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleCopyTracking(parcel.trackingNo); }} className="p-2 rounded-full hover:bg-gray-200">
                            {copiedTrackingNo === parcel.trackingNo ? <BsCheckLg /> : <MdContentCopy />}
                          </button>
                        </div>
                        <div className="text-sm pl-4">{formatDate(parcel.createdAt)}</div>
                        <div className="text-sm pl-4 truncate">{parcel.senderAddress?.company || parcel.senderAddress?.name || "-"}</div>
                        <div className="text-sm pl-4 truncate">{parcel.recipientAddress?.company || parcel.recipientAddress?.name || "-"}</div>
                        <div className="text-sm pl-4">{sk === 'delivered' ? calculateDuration(parcel.shippedAt, parcel.deliveredAt) : "-"}</div>
                        <div className="text-sm pl-4">{sk === 'delivered' && temperatureData[parcel.id] ? temperatureData[parcel.id].toFixed(1) : "-"}</div>
                        <div className="flex items-center text-sm bg-gray-200 px-3 py-2 w-30 rounded-md ml-4">
                          {sk === 'pending' ? <FaRegCircle className="mr-3" /> : sk === 'delivered' ? <FaRegCheckCircle className="mr-3" /> : <FaRegDotCircle className="mr-3" />}
                          {sk.charAt(0).toUpperCase() + sk.slice(1).replace('_', ' ')}
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

export default IncomingPage;