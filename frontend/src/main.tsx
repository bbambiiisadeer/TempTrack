import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Recent from "./pages/recent.tsx";
import FirstPage from "./pages/firstpage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/recent" element={<Recent />} />
      </Routes>
    </Router>
  </StrictMode>
);
