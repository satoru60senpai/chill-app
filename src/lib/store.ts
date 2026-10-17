'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GeneratorPrefs, OutingPlanDraft, Profile, Tab } from './types';
import { uid } from './format';

export const DEFAULT_PREFS: GeneratorPrefs = {
  mood: 'chill',
  budgetPerPerson: 6000,
  strict: false,
  people: 2,
  timeSlot: 'apres-midi',
  dayChoice: 'aujourdhui',
};

export const DEFAULT_PROFILE: Profile = {
  name: '',
  avatar: '🌸',
  defaultBudget: 6000,
  city: 'Lomé',
  notifEnabled: true,
};

interface ChillState {
  // Persisté
  deviceId: string;
  profile: Profile;
  favorites: string[];
  plans: OutingPlanDraft[];
  prefs: GeneratorPrefs;
  adminKey: string;
  onboardingDone: boolean;

  // Transient
  tab: Tab;
  detailPlaceId: string | null;
  detailCollectionId: string | null;
  generatorOpen: boolean;
  lastPlanId: string | null;

  setDeviceId: (id: string) => void;
  setProfile: (p: Partial<Profile>) => void;
  setOnboardingDone: (v: boolean) => void;
  toggleFavorite: (placeId: string) => boolean;
  savePlan: (plan: OutingPlanDraft) => void;
  deletePlan: (id: string) => void;
  setPlanStatus: (id: string, status: 'planned' | 'done') => void;
  setPrefs: (p: Partial<GeneratorPrefs>) => void;
  setAdminKey: (k: string) => void;
  setTab: (t: Tab) => void;
  openPlace: (id: string) => void;
  closePlace: () => void;
  openCollection: (id: string) => void;
  closeCollection: () => void;
  setGeneratorOpen: (v: boolean) => void;
  setLastPlan: (id: string | null) => void;
}

export const useChillStore = create<ChillState>()(
  persist(
    (set, get) => ({
      deviceId: '',
      profile: DEFAULT_PROFILE,
      favorites: [],
      plans: [],
      prefs: DEFAULT_PREFS,
      adminKey: '',
      onboardingDone: false,

      tab: 'home',
      detailPlaceId: null,
      detailCollectionId: null,
      generatorOpen: false,
      lastPlanId: null,

      setDeviceId: (id) => set({ deviceId: id }),
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setOnboardingDone: (v) => set({ onboardingDone: v }),

      toggleFavorite: (placeId) => {
        const { favorites } = get();
        const has = favorites.includes(placeId);
        set({ favorites: has ? favorites.filter((f) => f !== placeId) : [...favorites, placeId] });
        return !has;
      },

      savePlan: (plan) => set({ plans: [plan, ...get().plans.filter((p) => p.id !== plan.id)], lastPlanId: plan.id }),
      deletePlan: (id) => set({ plans: get().plans.filter((p) => p.id !== id) }),
      setPlanStatus: (id, status) =>
        set({ plans: get().plans.map((p) => (p.id === id ? { ...p, status } : p)) }),

      setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),
      setAdminKey: (k) => set({ adminKey: k }),

      setTab: (t) => set({ tab: t }),
      openPlace: (id) => set({ detailPlaceId: id }),
      closePlace: () => set({ detailPlaceId: null }),
      openCollection: (id) => set({ detailCollectionId: id }),
      closeCollection: () => set({ detailCollectionId: null }),
      setGeneratorOpen: (v) => set({ generatorOpen: v }),
      setLastPlan: (id) => set({ lastPlanId: id }),
    }),
    {
      name: 'chill-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        deviceId: s.deviceId,
        profile: s.profile,
        favorites: s.favorites,
        plans: s.plans,
        prefs: s.prefs,
        adminKey: s.adminKey,
        onboardingDone: s.onboardingDone,
      }),
    },
  ),
);

/** Appelle une seule fois au montage pour garantir un deviceId stable */
export function ensureDeviceId(): string {
  const { deviceId, setDeviceId } = useChillStore.getState();
  if (deviceId) return deviceId;
  const id = uid();
  setDeviceId(id);
  return id;
}
