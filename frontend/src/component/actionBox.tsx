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

  const getTranslateClass = (index: number) => { 
    if (index === 0 || index === 1) {
      return "translate-y-1";
    } else if (index === 3 || index === 4) {
      return "-translate-y-1";
    }else if (index === 2) {
      return "-translate-y-0.5";
    }
   
  };

  const translateClass = getTranslateClass(currentIndex);

  return (
    <div className="h-121 flex items-center justify-center ">
      <img
        src={images[currentIndex]}
        alt={`action${currentIndex + 1}`}
        className={`w-full h-full object-contain  transform ${translateClass}`}
      />
    </div>
  );
}

export default ActionBox;