import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

interface DriverData {
  name: string;
  email: string;
  phoneNumber: string;
  regNumber: string;
  imageUrl: string;
}

function AMadddriver() {
  const navigate = useNavigate();

  const [driver, setDriver] = useState<DriverData>({
    name: "",
    email: "",
    phoneNumber: "",
    regNumber: "",
    imageUrl: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDriver((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        setDriver((prev) => ({ ...prev, imageUrl: compressedImage }));
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Error processing image");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(driver),
      });

      if (!res.ok) throw new Error("Failed to create driver");

      const data = await res.json();
      console.log("Driver created:", data);
      navigate("/amdriver");
    } catch (err) {
      console.error(err);
      alert("Error creating driver");
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
        Driver Information
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-t-2xl shadow-md w-full max-w-[860px] space-y-4"
      >
        {/* Image Upload Section */}
        <div className="flex justify-center mb-8">
          <div
            onClick={handleImageClick}
            className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Driver preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-gray-400 text-sm mt-2">Add Photo</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm inter">Full Name</label>
          <input
            type="text"
            name="name"
            value={driver.name}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
            required
          />
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm inter">Email</label>
          <input
            type="email"
            name="email"
            value={driver.email}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 mt-4">
          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={driver.phoneNumber}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">
              Registration Number
            </label>
            <input
              type="text"
              name="regNumber"
              value={driver.regNumber}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            type="button"
            onClick={() => navigate("/amdriver")}
            className="text-black font-normal inter text-sm mr-8 bg-transparent border-none cursor-pointer hover:underline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-black text-sm hover:bg-gray-800 text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Done
          </button>
        </div>
      </form>
    </div>
  );
}

export default AMadddriver;
