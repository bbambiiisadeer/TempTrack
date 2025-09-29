import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import { useAuth } from "./AuthContext";
import { type Address } from "./types";

function Address() {
  const { user } = useAuth();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const userId = user?.id || null;

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
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex justify-between items-center px-8 py-5 border-b border-black">
        <img src="/images/logo.png" alt="logo" className="h-7 object-contain" />
        <div className="flex gap-26">
          <Link
            to="/sent"
            className="text-sm text-black hover:underline transition"
          >
            Sent
          </Link>
          <Link
            to="/incoming"
            className="text-sm text-black hover:underline transition"
          >
            Incoming
          </Link>
          <Link
            to="/notification"
            className="text-sm text-black hover:underline transition"
          >
            Notification
          </Link>
          <Link
            to="/address"
            className="text-sm text-black underline transition"
          >
            Address
          </Link>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-medium">
          {firstLetter}
        </div>
      </div>

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

      <div className="px-8">
        <div className="bg-white rounded-t-2xl shadow-md px-8 min-h-163">
          {addresses.length === 0 ? (
            <p className="text-gray-500 p-8">No saved addresses.</p>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="border-b border-black p-4 space-y-2 cursor-pointer"
              >
                <div className="flex justify-between items-start py-1.5">
                  <div className="space-y-1">
                    <p className="font-medium text-md inter flex items-center gap-2">
                      {addr.name}
                      <span className="border-l-[1.5px] border-gray-400 h-4"></span>
                      <span className="font-normal text-sm inter text-gray-400">
                        {addr.phoneNumber || "-"}
                      </span>
                    </p>

                    {addr.company && <p className="text-sm">{addr.company}</p>}
                    <p className="text-sm">
                      {addr.address} {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    {addr.email && <p className="text-sm">{addr.email}</p>}
                  </div>

                  <div className="flex gap-4 mt-1">
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
  );
}

export default Address;
