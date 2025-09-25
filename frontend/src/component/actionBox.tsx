import { useState, useEffect } from "react";

const images = [
  "/images/action1.png",
  "/images/action2.png",
  "/images/action3.png",
  "/images/action4.png",
  "/images/action5.png",
];

function ActionBox() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 400); 

    return () => clearInterval(interval); 
  }, []);

  return (
    <div className="h-[30.0625rem] flex items-center justify-center ">
      <img
        src={images[currentIndex]}
        alt={`action${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default ActionBox;
