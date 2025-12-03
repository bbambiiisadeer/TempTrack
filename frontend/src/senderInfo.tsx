import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { type Recipient } from "./types";
import { useShipping } from "./shippingContext";
import { useAuth } from "./AuthContext";
import "./index.css";

interface Province {
  id: number;
  provinceCode: number;
  provinceNameEn: string;
  provinceNameTh: string;
}

interface District {
  id: number;
  provinceCode: number;
  districtCode: number;
  districtNameEn: string;
  districtNameTh: string;
  postalCode: number;
}

interface Subdistrict {
  id: number;
  provinceCode: number;
  districtCode: number;
  subdistrictCode: number;
  subdistrictNameEn: string;
  subdistrictNameTh: string;
  postalCode: number;
}

function SenderInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const userId = user?.id || null;

  const handleSelectSavedAddress = () => {
    navigate("/saveaddress?from=sender");
  };

  const { setSenderAddressId, senderFormData, setSenderFormData } = useShipping();

  const [sender, setSender] = useState<Recipient>(() => {
    return senderFormData || {
      name: "",
      company: "",
      address: "",
      province: "",
      district: "",
      subdistrict: "",
      postalCode: "",
      email: "",
      phoneNumber: "",
    };
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isSubdistrictOpen, setIsSubdistrictOpen] = useState(false);

  // Refs for click outside
  const provinceRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const subdistrictRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    setSenderFormData(sender);
  }, [sender, setSenderFormData]);

  useEffect(() => {
    const selectedAddress = location.state?.selectedAddress;
    if (selectedAddress) {
      const newSender = {
        name: selectedAddress.name || "",
        company: selectedAddress.company || "",
        address: selectedAddress.address || "",
        province: selectedAddress.province || "",
        district: selectedAddress.district || "",
        subdistrict: selectedAddress.subdistrict || "",
        postalCode: selectedAddress.postalCode || "",
        email: selectedAddress.email || "",
        phoneNumber: selectedAddress.phoneNumber || "",
      };

      setSender(newSender);
      setSelectedAddressId(selectedAddress.id || null);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load districts when province is set
  useEffect(() => {
    if (sender.province && provinces.length > 0) {
      const province = provinces.find(p => p.provinceNameEn === sender.province);
      if (province) {
        fetchDistricts(province.provinceCode);
      }
    }
  }, [sender.province, provinces]);

  // Load subdistricts when district is set
  useEffect(() => {
    if (sender.district && districts.length > 0) {
      const district = districts.find(d => d.districtNameEn === sender.district);
      if (district) {
        fetchSubdistricts(district.districtCode);
      }
    }
  }, [sender.district, districts]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setIsProvinceOpen(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setIsDistrictOpen(false);
      }
      if (subdistrictRef.current && !subdistrictRef.current.contains(event.target as Node)) {
        setIsSubdistrictOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/provinces.json"
      );
      const data = await response.json();
      const sortedData = data.sort((a: Province, b: Province) => 
        a.provinceNameEn.localeCompare(b.provinceNameEn)
      );
      setProvinces(sortedData);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      alert("Failed to load provinces data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceCode: number) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/districts.json"
      );
      const data: District[] = await response.json();
      const filtered = data.filter((d) => d.provinceCode === provinceCode);
      const sortedFiltered = filtered.sort((a, b) => 
        a.districtNameEn.localeCompare(b.districtNameEn)
      );
      setDistricts(sortedFiltered);
    } catch (error) {
      console.error("Error fetching districts:", error);
      alert("Failed to load districts data");
    }
  };

  const fetchSubdistricts = async (districtCode: number) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/subdistricts.json"
      );
      const data: Subdistrict[] = await response.json();
      const filtered = data.filter((s) => s.districtCode === districtCode);
      const sortedFiltered = filtered.sort((a, b) => 
        a.subdistrictNameEn.localeCompare(b.subdistrictNameEn)
      );
      setSubdistricts(sortedFiltered);
    } catch (error) {
      console.error("Error fetching subdistricts:", error);
      alert("Failed to load subdistricts data");
    }
  };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setSender((prev) => ({ ...prev, [name]: value }));

    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
  }

  const handleProvinceSelect = (province: Province) => {
    setSender({
      ...sender,
      province: province.provinceNameEn,
      district: "",
      subdistrict: "",
      postalCode: "",
    });
    fetchDistricts(province.provinceCode);
    setSubdistricts([]);
    setIsProvinceOpen(false);
    
    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
  };

  const handleDistrictSelect = (district: District) => {
    setSender({
      ...sender,
      district: district.districtNameEn,
      subdistrict: "",
      postalCode: String(district.postalCode),
    });
    fetchSubdistricts(district.districtCode);
    setIsDistrictOpen(false);
    
    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
  };

  const handleSubdistrictSelect = (subdistrict: Subdistrict) => {
    setSender({
      ...sender,
      subdistrict: subdistrict.subdistrictNameEn,
      postalCode: String(subdistrict.postalCode),
    });
    setIsSubdistrictOpen(false);
    
    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedAddressId) {
        console.log("Using saved address ID:", selectedAddressId);
        setSenderAddressId(selectedAddressId);
        navigate("/recipientinfo");
        return;
      }

      if (!userId) {
        alert("User not logged in");
        return;
      }

      const res = await fetch("http://localhost:3000/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...sender,
          userId,
          type: "sender",
          isSaved: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit sender");

      const data = await res.json();
      console.log("Inserted new sender:", data);
      setSenderAddressId(data.data.id);
      navigate("/recipientinfo");
    } catch (err) {
      console.error(err);
      alert("Error submitting sender info");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F1ECE6" }}
      >
        <div className="text-2xl"></div>
      </div>
    );
  }

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
        className="bg-white p-8 rounded-t-2xl shadow-md w-full max-w-[860px] space-y-4"
      >
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

        <div className="flex flex-col mb-7 mt-2">
          <label className="mb-2 font-normal text-sm inter">Full Name</label>
          <input
            type="text"
            name="name"
            value={sender.name}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
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
            className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
          />
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col mb-7 md:col-span-2">
            <label className="mb-2 font-normal text-sm">Address</label>
            <input
              type="text"
              name="address"
              value={sender.address}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
              required
            />
          </div>

          {/* Province Dropdown - ปรับความสูงเป็น h-11 */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={provinceRef}>
            <label className="mb-2 font-normal text-sm">Province</label>
            <button
              type="button"
              onClick={() => setIsProvinceOpen(!isProvinceOpen)}
              className="border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors h-11"
            >
              <span className={`block truncate max-w-full ${sender.province ? "" : "text-gray-400"}`}>
                {sender.province || ""}
              </span>
              <IoIosArrowDown className="w-4 h-4" />
            </button>

            {isProvinceOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {provinces.map((province) => (
                  <button
                    key={province.id}
                    type="button"
                    onClick={() => handleProvinceSelect(province)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sender.province === province.provinceNameEn
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {province.provinceNameEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ปรับ margin ด้านบนให้ชิดขึ้น (-mt-3) */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 -mt-3">
          {/* District Dropdown - ปรับความสูงเป็น h-11.5 และใช้ truncate */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={districtRef}>
            <label className="mb-2 font-normal text-sm inter">District</label>
            <button
              type="button"
              onClick={() =>
                sender.province && setIsDistrictOpen(!isDistrictOpen)
              }
              disabled={!sender.province}
              className={`border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors h-11.5 ${
                !sender.province
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className={`block truncate max-w-full ${sender.district ? "" : ""}`}>
                {sender.district || ""}
              </span>
              <IoIosArrowDown className="w-4 h-4" />
            </button>

            {isDistrictOpen && sender.province && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {districts.map((district) => (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => handleDistrictSelect(district)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sender.district === district.districtNameEn
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {district.districtNameEn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subdistrict Dropdown - ปรับความสูงเป็น h-11.5 และใช้ truncate */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={subdistrictRef}>
            <label className="mb-2 font-normal text-sm inter">
              Subdistrict
            </label>
            <button
              type="button"
              onClick={() =>
                sender.district && setIsSubdistrictOpen(!isSubdistrictOpen)
              }
              disabled={!sender.district}
              className={`border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors h-11.5 ${
                !sender.district
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className={`block truncate max-w-full ${sender.subdistrict ? "" : ""}`}>
                {sender.subdistrict || ""}
              </span>
              <IoIosArrowDown className="w-4 h-4" />
            </button>

            {isSubdistrictOpen && sender.district && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {subdistricts.map((subdistrict) => (
                  <button
                    key={subdistrict.id}
                    type="button"
                    onClick={() => handleSubdistrictSelect(subdistrict)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sender.subdistrict === subdistrict.subdistrictNameEn
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {subdistrict.subdistrictNameEn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Postal Code */}
          <div className="flex flex-col mb-7 md:col-span-1">
            <label className="mb-2 font-normal text-sm inter">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={sender.postalCode}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>
        </div>

        {/* ปรับ margin ด้านบนให้ชิดขึ้น (-mt-2) */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 -mt-2">
          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm inter">Email</label>
            <input
              type="email"
              name="email"
              value={sender.email}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
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
              className="border-b border-black px-3 py-3 text-sm resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-black"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-4">
          <button
            type="button"
            onClick={handleSelectSavedAddress}
            className="text-black font-normal inter text-sm mr-8 bg-transparent border-none cursor-pointer hover:underline"
          >
            Select Saved Address?
          </button>
          <button
            type="submit"
            className="bg-black text-sm hover:bg-gray-800 text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

export default SenderInfo;