import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import SenderInfo from "./senderInfo";
import RecipientInfo from "./recipientInfo";
import ParcelDetail from "./parceldetail";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/senderinfo" element={<SenderInfo />} />
        <Route path="/recipientinfo" element={<RecipientInfo />} />
        <Route path="/parceldetail" element={<ParcelDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);