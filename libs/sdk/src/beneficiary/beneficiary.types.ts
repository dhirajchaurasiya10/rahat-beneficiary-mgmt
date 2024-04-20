import { BankedStatus, Gender, InternetStatus, PhoneStatus } from '../enums';

export type Beneficiary = {
  id?: number;
  uuid?: string;
  customId?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: Date;
  walletAddress?: string;
  phone?: string;
  email?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  govtIDNumber?: string;
  notes?: string;
  bankedStatus?: BankedStatus;
  internetStatus?: InternetStatus;
  phoneStatus?: PhoneStatus;
  extras?: any;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export type ImportBeneficiary = {
  success?: boolean;
  status?: number;
  message?: string;
};

export type UpdateBeneficiary = {
  id?: number;
  uuid?: string;
  customId?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: Date;
  walletAddress?: string;
  phone?: string;
  email?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  govtIDNumber?: string;
  notes?: string;
  bankedStatus?: BankedStatus;
  internetStatus?: InternetStatus;
  phoneStatus?: PhoneStatus;
  extras?: any;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export type ListBeneficiary = {
  id?: number;
  uuid?: string;
  customId?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: Date;
  walletAddress?: string;
  phone?: string;
  email?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  govtIDNumber?: string;
  notes?: string;
  bankedStatus?: BankedStatus;
  internetStatus?: InternetStatus;
  phoneStatus?: PhoneStatus;
  extras?: any;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export type Stats = {
  name: string;
  data: any;
  group: string;
};
