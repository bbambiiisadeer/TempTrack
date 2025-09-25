import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface SenderFormData {
  name: string;
  company: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
}

interface ParcelFormData {
  senderAddressId: string;
  recipientAddressId: string;
  parcelName: string;
  quantity?: number;
  weight?: number;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  temperatureRangeMin?: number;
  temperatureRangeMax?: number;
  allowedDeviation?: number;
  specialNotes?: string; 
}

interface ShippingContextType {
  senderAddressId: string | null;
  recipientAddressId: string | null;
  setSenderAddressId: (id: string) => void;
  setRecipientAddressId: (id: string) => void;
  resetShippingData: () => void;

  senderFormData: SenderFormData | null;
  setSenderFormData: (data: SenderFormData | null) => void;
  recipientFormData: SenderFormData | null;
  setRecipientFormData: (data: SenderFormData | null) => void;
  parcelFormData: ParcelFormData | null;
  setParcelFormData: (data: ParcelFormData | null) => void;
}

const ShippingContext = createContext<ShippingContextType | undefined>(undefined);

export const useShipping = () => {
  const context = useContext(ShippingContext);
  if (!context) {
    throw new Error('useShipping must be used within a ShippingProvider');
  }
  return context;
};

interface ShippingProviderProps {
  children: ReactNode;
}

export const ShippingProvider: React.FC<ShippingProviderProps> = ({ children }) => {
  const [senderAddressId, setSenderAddressId] = useState<string | null>(null);
  const [recipientAddressId, setRecipientAddressId] = useState<string | null>(null);

  const [senderFormData, setSenderFormData] = useState<SenderFormData | null>(null);
  const [recipientFormData, setRecipientFormData] = useState<SenderFormData | null>(null);
  const [parcelFormData, setParcelFormData] = useState<ParcelFormData | null>(null);

  const resetShippingData = () => {
    setSenderAddressId(null);
    setRecipientAddressId(null);
    setSenderFormData(null);
    setRecipientFormData(null);
    setParcelFormData(null);
  };

  const value = {
    senderAddressId,
    recipientAddressId,
    setSenderAddressId,
    setRecipientAddressId,
    resetShippingData,
    senderFormData,
    setSenderFormData,
    recipientFormData,
    setRecipientFormData,
    parcelFormData,
    setParcelFormData,
  };

  return (
    <ShippingContext.Provider value={value}>
      {children}
    </ShippingContext.Provider>
  );
};