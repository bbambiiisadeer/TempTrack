import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ShippingContextType {
  senderAddressId: string | null;
  recipientAddressId: string | null;
  setSenderAddressId: (id: string) => void;
  setRecipientAddressId: (id: string) => void;
  resetShippingData: () => void;
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

  const resetShippingData = () => {
    setSenderAddressId(null);
    setRecipientAddressId(null);
  };

  const value = {
    senderAddressId,
    recipientAddressId,
    setSenderAddressId,
    setRecipientAddressId,
    resetShippingData,
  };

  return (
    <ShippingContext.Provider value={value}>
      {children}
    </ShippingContext.Provider>
  );
};