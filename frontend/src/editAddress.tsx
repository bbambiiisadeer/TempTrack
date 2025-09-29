import { useState, useEffect, useRef } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";

function EditAddress() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams] = useSearchParams();
  const fromPage = searchParams.get("from");

  const [sender, setSender] = useState({
    id: "",
    name: "",
    company: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (location.state?.address) {
      setSender(location.state.address);
    } else if (id) {
      fetch(`http://localhost:3000/address/${id}`)
        .then((res) => res.json())
        .then((data) => setSender(data));
    }
  }, [id, location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSender((prev) => ({ ...prev, [name]: value }));
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
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
          <label className="mb-2 font-normal text-sm inter">Full Name</label>
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
          <label className="mb-2 font-normal text-sm inter">Company</label>
          <input
            type="text"
            name="company"
            value={sender.company}
            onChange={handleChange}
            className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
            className="border-b border-black px-3 py-3 text-sm resize-none focus:outline-none"
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
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
              className="border-b border-black px-3 py-3 text-sm focus:outline-none"
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
            className="text-black font-normal inter text-sm mr-8 bg-transparent border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-black text-sm text-white py-2 px-6 rounded-full w-32 h-12"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAddress;
