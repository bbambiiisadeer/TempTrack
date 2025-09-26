import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShipping } from "./shippingContext";
import { type Parcel } from "./types";
import { useAuth } from "./AuthContext";
import "./index.css";

function ParcelDetail() {
  const navigate = useNavigate();
  const {
    senderAddressId,
    recipientAddressId,
    resetShippingData,
    parcelFormData,
    setParcelFormData,
  } = useShipping();

  const { user } = useAuth();
  const userId = user?.id || null;

  const [parcel, setParcel] = useState<Parcel>(() => {
    return (
      parcelFormData || {
        senderAddressId: "",
        recipientAddressId: "",
        parcelName: "",
        quantity: undefined,
        weight: undefined,
        dimensionLength: undefined,
        dimensionWidth: undefined,
        dimensionHeight: undefined,
        temperatureRangeMin: undefined,
        temperatureRangeMax: undefined,
        allowedDeviation: undefined,
        specialNotes: "",
      }
    );
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setParcelFormData(parcel);
  }, [parcel, setParcelFormData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setParcel((prev) => ({
      ...prev,
      [name]:
        e.target.type === "number"
          ? value === ""
            ? undefined
            : parseFloat(value)
          : value,
    }));
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
  }, [parcel.specialNotes]);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  useEffect(() => {
    if (!initialCheckDone) {
      if (!senderAddressId || !recipientAddressId) {
        alert("Please complete sender and recipient information first");
      }
      setInitialCheckDone(true);
    }
  }, [senderAddressId, recipientAddressId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderAddressId || !recipientAddressId) {
      alert("Missing sender or recipient address information");
      return;
    }

    if (!userId) {
      alert("User not logged in");
      return;
    }

    try {
      const parcelData = {
        ...parcel,
        senderAddressId,
        recipientAddressId,
        userId,
      };

      const res = await fetch("http://localhost:3000/parcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parcelData),
      });

      if (!res.ok) throw new Error("Failed to submit parcel");

      const data = await res.json();
      console.log("Inserted parcel:", data);

      const resetParcel = {
        senderAddressId: "",
        recipientAddressId: "",
        parcelName: "",
        quantity: undefined,
        weight: undefined,
        dimensionLength: undefined,
        dimensionWidth: undefined,
        dimensionHeight: undefined,
        temperatureRangeMin: undefined,
        temperatureRangeMax: undefined,
        allowedDeviation: undefined,
        specialNotes: "",
      };

      setParcel(resetParcel);
      resetShippingData();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error submitting parcel info");
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
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-tl-2xl rounded-tr-2xl shadow-md w-full max-w-[860px] space-y-4"
      >
        <div className="flex items-center justify-between w-full max-w-[500px] mx-auto mb-8">
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate("/senderinfo")}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-black text-white font-medium">
              1
            </div>
            <span className="mt-2 text-black font-medium text-xs text-center">
              Sender <br /> Information
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-black -mt-10 -mr-4 -ml-4"></div>

          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate("/recipientinfo")}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black bg-black text-white font-medium">
              2
            </div>
            <span className="mt-2 text-black font-medium text-xs text-center">
              Recipient <br /> Information
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-black -mt-10  -ml-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black text-black font-medium">
              3
            </div>
            <span className="mt-2 text-black font-medium text-xs text-center">
              Parcel <br /> Details
            </span>
          </div>
        </div>
        <div className="flex gap-22 mb-7">
          <div className="flex flex-col flex-1">
            <label className="mb-2 font-normal text-sm inter">Product</label>
            <input
              type="text"
              name="parcelName"
              value={parcel.parcelName}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>

          <div className="flex flex-col w-58">
            <label className="mb-2 font-normal text-sm inter">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={parcel.quantity ?? ""}
              onChange={handleChange}
              className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-22">
          <div className="flex flex-col">
            <label className="mb-2 font-normal text-sm inter">Weight</label>
            <div className="flex items-center">
              <input
                type="number"
                name="weight"
                value={parcel.weight ?? ""}
                onChange={handleChange}
                className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="ml-2 text-sm">kg</span>
            </div>
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">Dimensions</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="dimensionLength"
                value={parcel.dimensionLength ?? ""}
                onChange={handleChange}
                placeholder="L"
                className="border-b border-black px-2 py-2 text-sm w-full 
             placeholder-gray-400 focus:placeholder-transparent
             focus:outline-none focus:ring-0 focus:border-black
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm">×</span>
              <input
                type="number"
                name="dimensionWidth"
                value={parcel.dimensionWidth ?? ""}
                onChange={handleChange}
                placeholder="W"
                className="border-b border-black px-2 py-2 text-sm w-full 
             placeholder-gray-400 focus:placeholder-transparent
             focus:outline-none focus:ring-0 focus:border-black
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm">×</span>
              <input
                type="number"
                name="dimensionHeight"
                value={parcel.dimensionHeight ?? ""}
                onChange={handleChange}
                placeholder="H"
                className="border-b border-black px-2 py-2 text-sm w-full 
             placeholder-gray-400 focus:placeholder-transparent
             focus:outline-none focus:ring-0 focus:border-black
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="ml-1 text-sm">cm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-22">
          <div className="flex flex-col">
            <label className="mb-2 font-normal text-sm inter">
              Temperature Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="temperatureRangeMin"
                value={parcel.temperatureRangeMin ?? ""}
                onChange={handleChange}
                placeholder="Min"
                className="border-b border-black px-2 py-2 text-sm w-full 
             placeholder-gray-400 focus:placeholder-transparent
             focus:outline-none focus:ring-0 focus:border-black
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                name="temperatureRangeMax"
                value={parcel.temperatureRangeMax ?? ""}
                onChange={handleChange}
                placeholder="Max"
                className="border-b border-black px-2 py-2 text-sm w-full 
             placeholder-gray-400 focus:placeholder-transparent
             focus:outline-none focus:ring-0 focus:border-black
             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="ml-1 text-sm">°C</span>
            </div>
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">
              Allowed Deviation
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm">±</span>
              <input
                type="number"
                name="allowedDeviation"
                value={parcel.allowedDeviation ?? ""}
                onChange={handleChange}
                className="border-b border-black px-3 py-2 text-sm w-full focus:outline-none focus:ring-0 focus:border-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="ml-1 text-sm">°C</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm inter">
            Special Notes
          </label>
          <textarea
            ref={textareaRef}
            name="specialNotes"
            value={parcel.specialNotes}
            onChange={handleChange}
            onInput={autoResize}
            rows={1}
            className="border-b border-black px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
          />
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            type="submit"
            className="bg-black text-sm text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Done
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParcelDetail;
