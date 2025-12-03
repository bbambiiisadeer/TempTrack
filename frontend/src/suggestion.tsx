import React, { useState } from "react";
import { FaRegCircle, FaRegDotCircle, FaRegCheckCircle } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { RiEdit2Line } from "react-icons/ri";
import { FaCheck } from "react-icons/fa6";

interface BoxItem {
  id: number;
  statusSubtitle: string;
  statusTitle: string;
  imagePath: string;
  icon: React.ElementType;
  content: React.ReactNode;
  imageWidthClass: string; 
}

const BOX_DATA: BoxItem[] = [
  {
    id: 1,
    statusSubtitle: "Delivery",
    statusTitle: "Stage",
    imagePath: "/images/guidebox1.png",
    icon: FaRegCircle,
    imageWidthClass: "h-10 mb-2.5 mr-2",
    content: (
      <div className="space-y-2">
        <div className="flex flex-col space-y-2 mt-2">
          
          <div className="bg-transparent rounded-lg grid grid-cols-[1fr_1.5fr_2fr] items-center py-4 pr-8">
            <div className="flex justify-center mr-4">
              <img
                src="/images/pending.png"
                alt="pending"
                className="w-11.5 object-contain"
              />
            </div>
            <div className="flex items-center text-sm bg-gray-200 px-3 py-2 rounded-md w-fit">
              <FaRegCircle className="text-black w-4 h-4 mr-3" />
              Pending
            </div>
            <div className="text-black">
              <p className="text-md font-semibold ">Pending</p>
              <p className="text-sm ">Waiting to be shipped</p>
            </div>
          </div>

          <div className="bg-transparent rounded-lg grid grid-cols-[1fr_1.5fr_2fr] items-center py-4 pr-8">
            <div className="flex justify-center mr-4">
              <img
                src="/images/car.png"
                alt="In transit"
                className="w-18 object-contain"
              />
            </div>
            <div className="flex items-center text-sm bg-gray-200 px-3 py-2 rounded-md w-fit">
              <FaRegDotCircle className="text-black w-4 h-4 mr-3" />
              In transit
            </div>
            <div className="text-black">
              <p className="text-md font-semibold ">In transit</p>
              <p className="text-sm ">Dispatched and on the way</p>
            </div>
          </div>

          <div className="bg-transparent rounded-lg grid grid-cols-[1fr_1.5fr_2fr] items-center py-4 pr-8">
            <div className="flex justify-center mr-4">
              <img
                src="/images/box6.png"
                alt="Delivered"
                className="w-15 object-contain"
              />
            </div>
            <div className="flex items-center text-sm bg-gray-200 px-3 py-2 rounded-md w-fit">
              <FaRegCheckCircle className="text-black w-4 h-4 mr-3" />
              Delivered
            </div>
            <div className="text-black">
              <p className="text-md font-semibold">Delivered</p>
              <p className="text-sm ">Received by the recipient</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    statusSubtitle: "Status Color",
    statusTitle: "Meaning",
    imagePath: "/images/guidebox2.png",
    icon: FaRegDotCircle,
    imageWidthClass: "h-10 mb-2.5", 
    content: (
      <div className="space-y-4 mt-5 w-120">
        <div className="bg-white rounded-lg flex justify-between items-start">
          <div className="flex items-center space-x-2 w-1/4">
            <FaCircle className="w-2.5 h-2.5 text-[#16A34A]" />
            <span className="text-sm font-medium text-[#16A34A] whitespace-nowrap">
              Within Temp
            </span>
          </div>

          <div className="flex flex-col text-left w-3/4">
            <p className="text-sm text-black">
              is the temperature is within the allowed min–max range
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg flex justify-between items-start">
          <div className="flex items-center space-x-2 w-1/4">
            <FaCircle className="w-2.5 h-2.5 text-[#DC2626]" />
            <span className="text-sm font-medium text-[#DC2626] whitespace-nowrap">
              Out of Range
            </span>
          </div>

          <div className="flex flex-col text-left w-3/4 ">
            <p className="text-sm  text-black">
              is the temperature is out of the allowed range
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    statusSubtitle: "Notification Page",
    statusTitle: "Button",
    imagePath: "/images/guidebox3.png",
    icon: FaRegCheckCircle,
    imageWidthClass: "h-15",
    content: (
      <div className="space-y-4 mt-5">
        <div className="flex items-stretch space-x- h-8 w-full">
          <div className="flex items-center space-x-2 w-1/10 justify-start">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <RiEdit2Line className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex items-center w-9/10">
            <p className="text-sm text-black">
              The recipient must sign to complete the delivery
            </p>
          </div>
        </div>
        <div className="flex items-stretch space-x- h-8 w-full">
          <div className="flex items-center space-x-2 w-1/10 justify-start">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <FaCheck className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex items-center w-9/10">
            <p className="text-sm text-black">
              The recipient has signed
            </p>
          </div>
        </div>
        <div className="flex items-stretch h-8 w-120 mt-6">
            <p className="text-md font-medium text-black">
              To sign
            </p>

        </div>
        <div className="flex items-stretch  h-8 w-120 -mt-4.5">
            <p className="text-sm text-black">
              Click once on the canvas to start drawing your signature. Click again to stop
            </p>

        </div>
      </div>
    ),
  },
];

function Suggestion() {
  const [activeBoxId, setActiveBoxId] = useState<number>(1); 

  const getBoxWidthClass = (id: number) => {
    if (id === activeBoxId) {
      return "w-[50%]";
    }
    return "w-[25%]";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center pt-24"
      style={{ backgroundColor: "#F1ECE6" }}
    >
      <div className="mb-8">
        <img src="/images/logo.png" alt="logo" className="h-7 object-contain" />
      </div>

      <h1 className="text-3xl font-semibold text-black mb-2">User Guide</h1>

      <div className="text-center mb-12">
        <p className="text-md text-black">
          Quick reference for icons, status indicators,
        </p>
        <p className="text-md text-black">and using notifications</p>
      </div>

      <div className="flex w-full max-w-6xl space-x-4 px-8">
        {BOX_DATA.map((item) => {
          const isActive = item.id === activeBoxId;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setActiveBoxId(item.id)}
              onMouseLeave={() => setActiveBoxId(1)} 
              className={`bg-white rounded-xl shadow-lg p-6 flex flex-col justify-start transition-all duration-300 ease-in-out cursor-pointer h-95 relative overflow-hidden ${getBoxWidthClass(
                item.id
              )}`}
            >
              <div
                className="text-black absolute top-6 left-6 transition-none"
                style={{ zIndex: 10 }}
              >
                <p className="text-2xl font-semibold text-black whitespace-nowrap">
                  {item.statusSubtitle}
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">{item.statusTitle}</p>
              </div>

              <div
                className={`min-w-120 mt-18 text-left ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transition: isActive ? 'opacity 0.1s ease-in-out' : 'none'
                }}
              >
                {isActive ? item.content : null}
              </div>

             <button
                className={`flex items-end justify-end absolute right-4 bottom-4 
                  transition-opacity duration-10 
                  ${
                    isActive
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100 pointer-events-auto"
                  }
                `}
            >
                <img 
                  src={item.imagePath} 
                  alt={`Box ${item.id} Icon`} 
                  className={`${item.imageWidthClass} w-auto object-contain`} 
                />
            </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Suggestion;