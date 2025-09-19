import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { type Recipient } from "./types";
import "./index.css";

function SenderInfo() {
    const navigate = useNavigate();
  const [sender, setSender] = useState<Recipient>({
    name: "",
    company: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setSender((prev) => ({ ...prev, [name]: value }));
  }

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [sender.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sender,
          userId: "f8961d2c-135a-4a0d-811a-1bbe1889e3e5",
          type: "sender",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit sender");

      const data = await res.json();
      console.log("Inserted sender:", data);
      
      navigate("/recipientinfo");
      
    } catch (err) {
      console.error(err);
      alert("Error submitting sender info");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="flex flex-row items-center gap-x-4 mt-6 mb-6">
        <img src="/images/box1.png" alt="Box1" className="w-12" />
        <img src="/images/box2.png" alt="Box2" className="w-20" />
        <img src="/images/box3.png" alt="Box3" className="w-20" />
      </div>
      <h1 className="text-[64px] font-semibold">fill in your</h1>
      <h2 className="text-[64px] font-semibold italic -mt-7 mb-6">
        Shipping Information
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-tl-2xl rounded-tr-2xl  shadow-md w-full max-w-[860px] space-y-4"
      >
       <div className="flex items-center justify-between w-full max-w-[500px] mx-auto mb-8">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-[1.5px] border-black text-black font-medium">
              1
            </div>
            <span className="mt-2 text-black font-normal text-xs text-center">
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
        
        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm inter">Full Name</label>
          <input
            type="text"
            name="name"
            value={sender.name}
            onChange={handleChange}
            className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
            required
          />
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm inter">Company</label>
          <input
            type="text"
            name="company"
            value={sender.company}
            onChange={handleChange}
            className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
          />
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm">Address</label>
          <textarea
            ref={textareaRef}
            name="address"
            value={sender.address}
            onChange={handleChange}
            onInput={autoResize}
            rows={3}
            className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">City</label>
            <input
              type="text"
              name="city"
              value={sender.city}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">State</label>
            <input
              type="text"
              name="state"
              value={sender.state}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={sender.postalCode}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 mt-4">
          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">Email</label>
            <input
              type="email"
              name="email"
              value={sender.email}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={sender.phoneNumber}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-4">
          <a
            href="/saved-addresses"
            className="text-black font-normal inter text-sm mr-8"
          >
            Select Saved Address?
          </a>
          <button
            type="submit"
            className="bg-black text-sm text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

export default SenderInfo;