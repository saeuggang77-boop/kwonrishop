import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// SSR-safe storage implementation
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface ListingFormData {
  // Step 0: 약관동의
  agreedToTerms: boolean;

  // Step 1: 위치정보
  zipCode: string;
  addressJibun: string;
  addressRoad: string;
  addressDetail: string;
  latitude: number | null;
  longitude: number | null;

  // Step 2: 업종 + 금액
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  premiumNegotiable: boolean;
  premiumBusiness: number | null;
  premiumBusinessDesc: string;
  premiumFacility: number | null;
  premiumFacilityDesc: string;
  premiumLocation: number | null;
  premiumLocationDesc: string;
  maintenanceFee: number | null;

  // Step 3: 기본정보
  brandType: "FRANCHISE" | "PRIVATE";
  storeName: string;
  currentFloor: number | null;
  totalFloor: number | null;
  isBasement: boolean;
  areaPyeong: number | null;
  areaSqm: number | null;
  themes: string[];
  parkingTotal: number | null;
  parkingPerUnit: number | null;
  parkingNone: boolean;

  // Step 4: 추가정보
  monthlyRevenue: number | null;
  expenseMaterial: number | null;
  expenseLabor: number | null;
  operationType: "SOLO" | "FAMILY" | "EMPLOYEE";
  familyWorkers: number | null;
  employeesFull: number | null;
  employeesPart: number | null;
  expenseRent: number | null;
  expenseMaintenance: number | null;
  expenseUtility: number | null;
  expenseOther: number | null;
  monthlyProfit: number | null;
  profitDescription: string;

  // Step 5: 매물설명
  description: string;

  // Step 6: 사진/연락처/매출증빙
  images: { file?: File; url: string; type: string; sortOrder: number }[];
  documents: { file?: File; url: string; sortOrder: number }[];
  contactPublic: boolean;
  contactPhone: string;
}

interface ListingFormStore {
  currentStep: number;
  data: ListingFormData;
  setStep: (step: number) => void;
  updateData: (partial: Partial<ListingFormData>) => void;
  reset: () => void;
}

const initialData: ListingFormData = {
  agreedToTerms: false,

  zipCode: "",
  addressJibun: "",
  addressRoad: "",
  addressDetail: "",
  latitude: null,
  longitude: null,

  categoryId: "",
  categoryName: "",
  subCategoryId: "",
  subCategoryName: "",
  deposit: 0,
  monthlyRent: 0,
  premium: 0,
  premiumNone: false,
  premiumNegotiable: false,
  premiumBusiness: null,
  premiumBusinessDesc: "",
  premiumFacility: null,
  premiumFacilityDesc: "",
  premiumLocation: null,
  premiumLocationDesc: "",
  maintenanceFee: null,

  brandType: "PRIVATE",
  storeName: "",
  currentFloor: null,
  totalFloor: null,
  isBasement: false,
  areaPyeong: null,
  areaSqm: null,
  themes: [],
  parkingTotal: null,
  parkingPerUnit: null,
  parkingNone: false,

  monthlyRevenue: null,
  expenseMaterial: null,
  expenseLabor: null,
  operationType: "SOLO",
  familyWorkers: null,
  employeesFull: null,
  employeesPart: null,
  expenseRent: null,
  expenseMaintenance: null,
  expenseUtility: null,
  expenseOther: null,
  monthlyProfit: null,
  profitDescription: "",

  description: "",

  images: [],
  documents: [],
  contactPublic: false,
  contactPhone: "",
};

export const useListingFormStore = create<ListingFormStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: { ...initialData },
      setStep: (step) => set({ currentStep: step }),
      updateData: (partial) =>
        set((state) => ({ data: { ...state.data, ...partial } })),
      reset: () => set({ currentStep: 1, data: { ...initialData } }),
    }),
    {
      name: "kwonrishop-listing-form",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      partialize: (state) => {
        // images와 documents는 persist에서 제외 (blob URL은 새로고침 시 무효화됨)
        const { images, documents, ...restData } = state.data;
        return {
          currentStep: state.currentStep,
          data: restData,
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as typeof currentState;
        return {
          ...currentState,
          ...persisted,
          data: {
            ...currentState.data,
            ...persisted?.data,
            images: [],
            documents: [],
          },
        };
      },
    },
  ),
);
