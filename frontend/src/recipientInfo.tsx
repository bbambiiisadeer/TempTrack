import { useState } from "react";
import { type Recipient } from "./types";

function RecipientInfo() {
  const [recipient, setRecipient] = useState<Recipient>({
    name: "",
    company: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setRecipient((prev) => ({ ...prev, [name]: value }));
  }

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/address", {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipient,
          userId: "00000000-0000-0000-0000-000000000000", 
        }),
      });

      if (!res.ok) throw new Error("Failed to submit recipient");

      const data = await res.json();
      console.log("Inserted recipient:", data);
      alert("Recipient info submitted successfully!");
      
      setRecipient({
        name: "",
        company: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        email: "",
        phoneNumber: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error submitting recipient info");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4"
      >
        <h1 className="text-2xl font-semibold mb-4">Recipient Information</h1>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Full Name</label>
          <input
            type="text"
            name="name"
            value={recipient.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Company</label>
          <input
            type="text"
            name="company"
            value={recipient.company}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Address</label>
          <textarea
            name="address"
            value={recipient.address}
            onChange={handleChange}
            rows={3}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium">City</label>
            <input
              type="text"
              name="city"
              value={recipient.city}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium">State</label>
            <input
              type="text"
              name="state"
              value={recipient.state}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={recipient.postalCode}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={recipient.email}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={recipient.phoneNumber}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default RecipientInfo;
