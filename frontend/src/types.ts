export interface Recipient {
  name: string;
  company: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
}

export interface Parcel {
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

export interface Address  {
  id: string;
  userId: string;
  name: string;
  company?: string;
  email?: string;
  phoneNumber?: string;
  type: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isSaved: boolean;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
}