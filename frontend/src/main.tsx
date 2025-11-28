import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ShippingProvider } from "./shippingContext";
import { TrackingProvider } from "./TrackingContext";
import SenderInfo from "./senderInfo";
import RecipientInfo from "./recipientInfo";
import ParcelDetail from "./parceldetail";  
import SaveAddress from "./saveAddress";
import EditAddress from "./editAddress";
import CreateAddress from "./createAddress";
import Homepage from "./homepage";
import ActionBox from "./component/actionBox";
import Signin from "./signin";
import Signup from "./signup";
import { AuthProvider } from './AuthContext';
import Address from "./address";
import Sent from "./sent";
import TrackStatus from "./trackStatus";
import IncomingPage from "./incoming";
import AMdashboard from "./AMdashboard";
import AMadddriver from "./AMadddriver";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <TrackingProvider>
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
              <Route path="/signup" element={<Signup />} />
              <Route path="/address" element={<Address />} />
              <Route path="/sent" element={<Sent />} />
              <Route path="/trackstatus" element={<TrackStatus />} />
              <Route path="/incoming" element={<IncomingPage />} />
              <Route path="/amdashboard" element={<AMdashboard />} />
              <Route path="/amadddriver" element={<AMadddriver />} />
            </Routes>
          </BrowserRouter>
        </ShippingProvider>
      </TrackingProvider>
    </AuthProvider>
  </React.StrictMode>
);