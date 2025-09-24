import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { type Address } from "./types";
import { RxCross2 } from "react-icons/rx";
import { IoAddCircleOutline } from "react-icons/io5";
import { AiFillEdit } from "react-icons/ai";
import "./index.css";

function SaveAddress() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const userId = "f8961d2c-135a-4a0d-811a-1bbe1889e3e5";

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/address?saved=true&userId=${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch saved addresses");
        const data = await res.json();
        setAddresses(data);
      } catch (err) {
        console.error(err);
      } finally {
      }
    };

    if (userId) {
      fetchSavedAddresses();
    }
  }, [userId]);

  const fromPage = location.state?.from;
  const isSenderPage = fromPage === "sender";
  const isRecipientPage = fromPage === "recipient";

  const handleClose = () => {
    if (fromPage === "sender") {
      navigate("/senderInfo");
    } else {
      navigate("/recipientInfo");
    }
  };

  const handleSelectAddress = (address: Address) => {
    if (fromPage === "sender") {
      navigate("/senderInfo", {
        state: {
          selectedAddress: address,
        },
      });
    } else {
      navigate("/recipientInfo", {
        state: {
          selectedAddress: address,
        },
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex flex-row items-center gap-x-4 mt-8 mb-4">
        <img src="/images/box1.png" alt="Box1" className="w-12" />
        <img src="/images/box2.png" alt="Box2" className="w-20" />
        <img src="/images/box3.png" alt="Box3" className="w-20" />
      </div>
      <h1 className="text-[64px] font-semibold">fill in your</h1>
      <h2 className="text-[64px] font-semibold italic -mt-7 mb-6">
        Shipping Information
      </h2>

      <div className="bg-white p-8 rounded-tl-2xl rounded-tr-2xl shadow-md w-full max-w-[860px] space-y-4">
        {isSenderPage && (
          <div className="flex items-center justify-between w-full max-w-[500px] mx-auto mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black text-black font-medium">
                1
              </div>
              <span className="mt-2 text-black font-medium text-xs text-center">
                Sender <br /> Information
              </span>
            </div>
            <div className="flex-1 h-[1.5px] bg-gray-400 -mt-10 -mr-4 -ml-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-[1.5px] border-gray-400 text-gray-400 font-medium">
                2
              </div>
              <span className="mt-2 text-gray-400 font-normal text-xs text-center">
                Recipient <br /> Information
              </span>
            </div>
            <div className="flex-1 h-[1.5px] bg-gray-400 -mt-10  -ml-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-[1.5px] border-gray-400 text-gray-400 font-medium">
                3
              </div>
              <span className="mt-2 text-gray-400 font-normal text-xs text-center">
                Parcel <br /> Details
              </span>
            </div>
          </div>
        )}

        {isRecipientPage && (
          <div className="flex items-center justify-between w-full max-w-[500px] mx-auto mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-black text-white font-medium">
                1
              </div>
              <span className="mt-2 text-black font-medium text-xs text-center">
                Sender <br /> Information
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-black -mt-10 -mr-4 -ml-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black text-black font-medium">
                2
              </div>
              <span className="mt-2 text-black font-medium text-xs text-center">
                Recipient <br /> Information
              </span>
            </div>
            <div className="flex-1 h-[1.5px] bg-gray-400 -mt-10  -ml-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full border-[1.5px] border-gray-400 text-gray-400 font-medium">
                3
              </div>
              <span className="mt-2 text-gray-400 font-normal text-xs text-center">
                Parcel <br /> Details
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="text-black p-2 hover:bg-gray-200 rounded-full"
          >
            <RxCross2 size={24} />
          </button>
          <span className="text-black font-normal text-sm">My Addresses</span>
        </div>
        <div className="space-y-1 -mt-2">
          {addresses.length > 0 &&
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="border-b space-y-0.5 border-black p-4 transition cursor-pointer "
                onClick={() => handleSelectAddress(addr)}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-md inter flex items-center gap-2">
                    {addr.name}
                    <span className="border-l-[1.5px] border-gray-400 h-4"></span>
                    <span className="font-normal text-sm inter text-gray-400">
                      {addr.phoneNumber || "-"}
                    </span>
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/editaddress/${addr.id}`, {
                        state: { address: addr },
                      });
                    }}
                    className="text-black mt-2"
                  >
                    <AiFillEdit size={20} />
                  </button>
                </div>

                {addr.company && (
                  <p className="font-normal text-sm inter">{addr.company}</p>
                )}
                <p className="font-normal text-sm inter">
                  {addr.address} {addr.city}, {addr.state} {addr.postalCode}
                </p>
                {addr.email && (
                  <p className="font-normal text-sm inter mb-1.5">
                    {addr.email}
                  </p>
                )}
              </div>
            ))}

          <button
            onClick={()  => navigate("/createaddress") }
            className="w-full bg-gray-100 rounded-lg py-3 flex items-center justify-center text-sm hover:bg-gray-200 mt-4"
          >
            <span className="text-lg mr-2">
              <IoAddCircleOutline size={24} />
            </span>{" "}
            Add New Address
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveAddress;
