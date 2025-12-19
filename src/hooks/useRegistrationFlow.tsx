import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Contexto para manejar el flujo de registro temporal
 * Los datos NO se guardan en DB hasta que el usuario acepte los términos
 */

interface GuestData {
  document_type: 'dni' | 'nie' | 'passport' | 'other';
  document_number: string;
  nationality: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  sex: 'm' | 'f' | 'other' | 'prefer-not';
  phone?: string;
  email?: string;
  is_responsible: boolean;
  registration_method: 'scan' | 'manual';
  document_image_path?: string;
}

interface PreferenceData {
  needs_crib: boolean;
  pets: boolean;
  double_beds: number;
  single_beds: number;
  sofa_beds: number;
  bunk_beds: number;
  estimated_arrival_time?: string;
  additional_info?: string;
  allergies?: string;
  special_requests?: string;
}

interface RegistrationFlowContextType {
  guestData: GuestData | null;
  preferenceData: PreferenceData | null;
  signatureData: string | null;

  setGuestData: (data: GuestData) => void;
  setPreferenceData: (data: PreferenceData) => void;
  setSignatureData: (data: string) => void;

  clearRegistrationData: () => void;
  isGuestDataComplete: boolean;
  isPreferenceDataComplete: boolean;
}

const RegistrationFlowContext = createContext<RegistrationFlowContextType | undefined>(undefined);

export const RegistrationFlowProvider = ({ children }: { children: ReactNode }) => {
  const [guestData, setGuestDataState] = useState<GuestData | null>(null);
  const [preferenceData, setPreferenceDataState] = useState<PreferenceData | null>(null);
  const [signatureData, setSignatureDataState] = useState<string | null>(null);

  const setGuestData = (data: GuestData) => {
    setGuestDataState(data);
  };

  const setPreferenceData = (data: PreferenceData) => {
    setPreferenceDataState(data);
  };

  const setSignatureData = (data: string) => {
    setSignatureDataState(data);
  };

  const clearRegistrationData = () => {
    setGuestDataState(null);
    setPreferenceDataState(null);
    setSignatureDataState(null);
  };

  const isGuestDataComplete = guestData !== null;
  const isPreferenceDataComplete = preferenceData !== null;

  return (
    <RegistrationFlowContext.Provider
      value={{
        guestData,
        preferenceData,
        signatureData,
        setGuestData,
        setPreferenceData,
        setSignatureData,
        clearRegistrationData,
        isGuestDataComplete,
        isPreferenceDataComplete,
      }}
    >
      {children}
    </RegistrationFlowContext.Provider>
  );
};

export const useRegistrationFlow = () => {
  const context = useContext(RegistrationFlowContext);
  if (!context) {
    throw new Error('useRegistrationFlow must be used within a RegistrationFlowProvider');
  }
  return context;
};
