import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ParcelData {
  id: string;
  trackingNo: string;
  isDelivered: boolean;
  isShipped: boolean;
  createdAt: string;
}

function AMdashboard() {
  const { user, logout, updateUser } = useAuth();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/parcel/all`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to fetch parcels");

        const data = await res.json();
        console.log("Fetched all parcels:", data);
        setParcels(data);
      } catch (err) {
        console.error("Error fetching parcels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, []);

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

  const totalPending = parcels.filter(p => !p.isDelivered && !p.isShipped).length;
  const totalShipped = parcels.filter(p => p.isShipped).length;
  const totalDelivered = parcels.filter(p => p.isDelivered).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F1ECE6" }}>
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

      {/* White boxes a b c */}
      <div className="flex justify-start gap-6 px-8 ">
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Total pending</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? "..." : totalPending}
          </span>
          <span className="text-black text-sm mt-3">Waiting to be shipped</span>
        </div>
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Shipped</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? "..." : totalShipped}
          </span>
          <span className="text-black text-sm mt-3">Has been dispatched and is on the way</span>
        </div>
        <div className="bg-white w-96 h-36 flex flex-col p-6 rounded-lg shadow">
          <span className="text-black text-sm">Delivered</span>
          <span className="text-4xl font-semibold mt-3">
            {loading ? "..." : totalDelivered}
          </span>
          <span className="text-black text-sm mt-3">Successfully received by the recipient</span>
        </div>
      </div>

      {/* Main container */}
      <div className="flex items-center justify-center">
        <div className="w-400">
          {/* ใส่ content อื่น ๆ ของ dashboard ได้ที่นี่ */}
        </div>
      </div>
    </div>
  );
}

export default AMdashboard;