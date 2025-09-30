import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import { useAuth } from "./AuthContext";
import { type Address } from "./types";

function Address() {
  const { user, logout, updateUser } = useAuth();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const userId = user?.id || null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        if (!userId) return;
        const res = await fetch(
          `http://localhost:3000/address?saved=true&userId=${userId}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch addresses");
        const data = await res.json();
        setAddresses(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSavedAddresses();
  }, [userId]);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      const res = await fetch(`http://localhost:3000/address/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to delete address");
      const data = await res.json();

      setAddresses((prev) => prev.filter((a) => a.id !== id));
      alert(data.msg);
    } catch (err) {
      console.error(err);
      alert("Error deleting address");
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex justify-between items-center px-8 py-5 border-b border-black">
        <img src="/images/logo.png" alt="logo" className="h-7 object-contain" />
        <div className="flex gap-26">
          <Link
            to="/sent"
            className="text-sm text-black hover:font-medium transition"
          >
            Sent
          </Link>
          <Link
            to="/incoming"
            className="text-sm text-black hover:font-medium transition"
          >
            Incoming
          </Link>
          <Link
            to="/notification"
            className="text-sm text-black hover:font-medium transition"
          >
            Notification
          </Link>
          <Link
            to="/address"
            className="text-sm text-black italic font-medium  transition"
          >
            Address
          </Link>
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
                <div className="w-10 h-10 min-w-[2.5rem] flex items-center justify-center rounded-full bg-black text-white font-medium flex-shrink-0">
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
                      className="text-sm font-semibold text-black border-b border-gray-300 focus:outline-none focus:border-black w-full h-[1.25rem] leading-[1.25rem] px-1 py-0"
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
                    <p className="text-sm font-semibold text-black h-[1.25rem] leading-[1.25rem]">
                      {user?.name || "No name"}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {" "}
                    {user?.email || "No email"}{" "}
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
                  className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100 hover:rounded-lg"
                >
                  {isEditingName ? "Save" : "Change Name"}
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-231">
          <div className="flex justify-between items-center px-8 py-6">
            <h2 className="text-2xl font-semibold text-black">Address</h2>
            <button
              className="flex items-center gap-2 bg-black text-white text-sm py-2 px-6 h-12 rounded-full"
              onClick={() => navigate("/createaddress?from=address")}
            >
              <IoIosAdd className="text-2xl font-black -ml-1" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="px-8 space-y-1 -mt-2">
            <div className="bg-white rounded-t-2xl shadow-md px-8 min-h-163 py-4">
              {addresses.length === 0 ? (
                <p className="text-gray-500 p-8">No saved addresses.</p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border-b space-y-0.5 border-black p-4 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start py-1.5">
                      <div className="space-y-0.5">
                        <p className="font-medium text-md inter flex items-center gap-2">
                          {addr.name}
                          <span className="border-l-[1.5px] border-gray-400 h-4"></span>
                          <span className="font-normal text-sm inter text-gray-400">
                            {addr.phoneNumber || "-"}
                          </span>
                        </p>
                        {addr.company && (
                          <p className="font-normal text-sm inter mt-1">
                            {addr.company}
                          </p>
                        )}
                        <p className="font-normal text-sm inter">
                          {addr.address} {addr.city}, {addr.state}{" "}
                          {addr.postalCode}
                        </p>
                        {addr.email && (
                          <p className="font-normal text-sm inter">
                            {addr.email}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-6 mt-1">
                        <AiFillEdit
                          size={22}
                          className="text-black cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editaddress/${addr.id}?from=address`, {
                              state: { address: addr },
                            });
                          }}
                        />
                        <MdDelete
                          size={24}
                          className="text-black cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(addr.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Address;
