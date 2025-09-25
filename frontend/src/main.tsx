import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ShippingProvider } from "./shippingContext";
import SenderInfo from "./senderInfo";
import RecipientInfo from "./recipientInfo";
import ParcelDetail from "./parceldetail";
import SaveAddress from "./saveAddress";
import EditAddress from "./editAddress";
import CreateAddress from "./createAddress";
import Homepage from "./homepage";
import ActionBox from "./component/actionBox";
import Signin from "./signin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ShippingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/senderinfo" element={<SenderInfo />} />
          <Route path="/recipientinfo" element={<RecipientInfo />} />
          <Route path="/parceldetail" element={<ParcelDetail />} />
          <Route path="/saveaddress" element={<SaveAddress />} />
          <Route path="/editaddress/:id" element={<EditAddress />} />
          <Route path="/createaddress" element={<CreateAddress />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/actionbox" element={<ActionBox />} />
          <Route path="/signin" element={<Signin />} />
        </Routes>
      </BrowserRouter>
    </ShippingProvider>
  </React.StrictMode>
);
