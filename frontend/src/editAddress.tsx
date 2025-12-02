import { useState, useEffect, useRef } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";

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

function EditAddress() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPage = searchParams.get("from");

  const [sender, setSender] = useState({
    id: "",
    name: "",
    company: "",
    address: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  // Dropdown states
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isSubdistrictOpen, setIsSubdistrictOpen] = useState(false);

  // Refs for click outside
  const provinceRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const subdistrictRef = useRef<HTMLDivElement>(null);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Load address data
  useEffect(() => {
    const loadAddress = async () => {
      if (location.state?.address) {
        setSender(location.state.address);
      } else if (id) {
        try {
          const res = await fetch(`http://localhost:3000/address/${id}`);
          const data = await res.json();
          setSender(data);
        } catch (error) {
          console.error("Error loading address:", error);
        }
      }
    };
    loadAddress();
  }, [id, location.state]);

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
      if (
        provinceRef.current &&
        !provinceRef.current.contains(event.target as Node)
      ) {
        setIsProvinceOpen(false);
      }
      if (
        districtRef.current &&
        !districtRef.current.contains(event.target as Node)
      ) {
        setIsDistrictOpen(false);
      }
      if (
        subdistrictRef.current &&
        !subdistrictRef.current.contains(event.target as Node)
      ) {
        setIsSubdistrictOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProvinces = async () => {
    try {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSender((prev) => ({ ...prev, [name]: value }));
  };

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
  };

  const handleSubdistrictSelect = (subdistrict: Subdistrict) => {
    setSender({
      ...sender,
      subdistrict: subdistrict.subdistrictNameEn,
      postalCode: String(subdistrict.postalCode),
    });
    setIsSubdistrictOpen(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:3000/address/${sender.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sender),
      });

      if (!res.ok) throw new Error("Failed to update address");

      await res.json();

      if (fromPage === "address") {
        navigate("/address");
      } else {
        navigate(`/saveaddress?from=${fromPage}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update address");
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

      <h1 className="text-[64px] font-semibold">edit</h1>
      <h2 className="text-[64px] font-semibold italic -mt-7 mb-6">Address</h2>

      <div className="bg-white p-8 rounded-t-2xl shadow-md w-full max-w-[860px] space-y-4">
        <div className="flex flex-col mb-7 mt-2">
          <label className="mb-2 font-normal text-sm">Full Name</label>
          <input
            type="text"
            name="name"
            value={sender.name}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col mb-7">
          <label className="mb-2 font-normal text-sm">Company</label>
          <input
            type="text"
            name="company"
            value={sender.company}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
            />
          </div>

          {/* Province Dropdown */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={provinceRef}>
            <label className="mb-2 font-normal text-sm">Province</label>
            <button
              type="button"
              onClick={() => setIsProvinceOpen(!isProvinceOpen)}
              className="border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors"
            >
              <span className={sender.province ? "" : "text-gray-400"}>
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

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* District Dropdown */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={districtRef}>
            <label className="mb-2 font-normal text-sm">District</label>
            <button
              type="button"
              onClick={() =>
                sender.province && setIsDistrictOpen(!isDistrictOpen)
              }
              disabled={!sender.province}
              className={`border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors ${
                !sender.province
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className={sender.district ? "" : ""}>
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

          {/* Subdistrict Dropdown */}
          <div className="flex flex-col mb-7 relative md:col-span-1" ref={subdistrictRef}>
            <label className="mb-2 font-normal text-sm">Subdistrict</label>
            <button
              type="button"
              onClick={() =>
                sender.district && setIsSubdistrictOpen(!isSubdistrictOpen)
              }
              disabled={!sender.district}
              className={`border-b border-black px-3 py-3 text-sm text-left flex items-center justify-between transition-colors ${
                !sender.district
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className={sender.subdistrict ? "" : ""}>
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
            <label className="mb-2 font-normal text-sm">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={sender.postalCode}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 mt-4">
          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={sender.email}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col mb-7">
            <label className="mb-2 font-normal text-sm">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={sender.phoneNumber}
              onChange={handleChange}
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            type="button"
            onClick={() => {
              if (fromPage === "address") {
                navigate("/address");
              } else {
                navigate(`/saveaddress?from=${fromPage}`);
              }
            }}
            className="text-black font-normal text-sm mr-8 bg-transparent border-none cursor-pointer hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-black text-sm hover:bg-gray-800 text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAddress;