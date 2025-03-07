import { useState, useEffect } from "react";
import leftEyeImage from "/images/eye/leye.png";
import rightEyeImage from "/images/eye/reye.png";

const Eye = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [leftEyePosition, setLeftEyePosition] = useState({ x: 0, y: 0 });
  const [rightEyePosition, setRightEyePosition] = useState({ x: 0, y: 0 });
  const [leftEyeRect, setLeftEyeRect] = useState<DOMRect | null>(null);
  const [rightEyeRect, setRightEyeRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const updateEyeRects = () => {
      const leftEye = document.getElementById("left-eye");
      const rightEye = document.getElementById("right-eye");

      if (leftEye && rightEye) {
        setLeftEyeRect(leftEye.getBoundingClientRect());
        setRightEyeRect(rightEye.getBoundingClientRect());
      }
    };

    updateEyeRects();
    window.addEventListener("resize", updateEyeRects);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateEyeRects);
    };
  }, []);

  useEffect(() => {
    if (leftEyeRect && rightEyeRect) {
      const leftEyeCenterX = leftEyeRect.left + leftEyeRect.width / 2;
      const leftEyeCenterY = leftEyeRect.top + leftEyeRect.height / 2;
      const rightEyeCenterX = rightEyeRect.left + rightEyeRect.width / 2;
      const rightEyeCenterY = rightEyeRect.top + rightEyeRect.height / 2;

      const leftEyeAngle = Math.atan2(
        mousePosition.y - leftEyeCenterY,
        mousePosition.x - leftEyeCenterX
      );
      const rightEyeAngle = Math.atan2(
        mousePosition.y - rightEyeCenterY,
        mousePosition.x - rightEyeCenterX
      );

      const leftEyeDistance = Math.min(
        Math.hypot(
          mousePosition.x - leftEyeCenterX,
          mousePosition.y - leftEyeCenterY
        ) / 10,
        20
      );
      const rightEyeDistance = Math.min(
        Math.hypot(
          mousePosition.x - rightEyeCenterX,
          mousePosition.y - rightEyeCenterY
        ) / 10,
        20
      );

      setLeftEyePosition({
        x: Math.cos(leftEyeAngle) * leftEyeDistance,
        y: Math.sin(leftEyeAngle) * leftEyeDistance,
      });
      setRightEyePosition({
        x: Math.cos(rightEyeAngle) * rightEyeDistance,
        y: Math.sin(rightEyeAngle) * rightEyeDistance,
      });
    }
  }, [mousePosition, leftEyeRect, rightEyeRect]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative w-full max-w-lg h-64">
        <div className="relative w-full h-full flex justify-center -space-x-17">
          <div className="relative w-70 h-full overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 160 200">
              {/* Define gradient for left eye */}
              <defs>
                <linearGradient
                  id="leftEyeGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#5285E8" />
                  <stop offset="40%" stopColor="#5285E8" />
                  <stop offset="40%" stopColor="white" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <ellipse
                cx="80"
                cy="100"
                rx="75"
                ry="90"
                fill="url(#leftEyeGradient)"
                stroke="black"
                strokeWidth="18"
              />
              <line
                x1="150"
                y1="90"
                x2="-20"
                y2="90"
                stroke="black"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Red overlay for upper part to cover pupil */}
              <path d="M15 81 L145 81 L65 30 Z" fill="#5285E8" />
            </svg>
            <div
              id="left-eye"
              className="absolute left-[45%] top-[60%] w-28 h-28"
              style={{
                transform: `translate(calc(-50% + ${leftEyePosition.x}px), calc(-50% + ${leftEyePosition.y}px))`,
              }}
            >
              <img
                src={leftEyeImage}
                alt="Left Eye"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="relative w-70 h-full overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 160 200">
              {/* Define gradient for right eye */}
              <defs>
                <linearGradient
                  id="rightEyeGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#5285E8" />
                  <stop offset="40%" stopColor="#5285E8" />
                  <stop offset="40%" stopColor="white" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <ellipse
                cx="80"
                cy="100"
                rx="75"
                ry="90"
                fill="url(#rightEyeGradient)"
                stroke="black"
                strokeWidth="18"
              />
              <line
                x1="10"
                y1="90"
                x2="180"
                y2="90"
                stroke="black"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Remove the blue triangle from here */}
            </svg>

            <div
              id="right-eye"
              className="absolute left-[52%] top-[60%] w-24 h-24 z-10"
              style={{
                transform: `translate(calc(-50% + ${rightEyePosition.x}px), calc(-50% + ${rightEyePosition.y}px))`,
              }}
            >
              <img
                src={rightEyeImage}
                alt="Right Eye"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Add blue triangle as an absolutely positioned SVG with higher z-index */}
            <div className="absolute inset-0 z-20">
              <svg width="100%" height="100%" viewBox="0 0 160 200">
                <path d="M15 81 L145 81 L65 30 Z" fill="#5285E8" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Eye;

