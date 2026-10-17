'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CatalogProvider } from '@/lib/catalog';
import { ensureDeviceId, useChillStore } from '@/lib/store';
import { IS_OFFLINE } from '@/lib/api';
import BottomNav from './BottomNav';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import MyOutingsScreen from './screens/MyOutingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlaceDetailSheet from './PlaceDetailSheet';
import CollectionDetailSheet from './CollectionDetailSheet';
import GeneratorScreen from './screens/GeneratorScreen';
import WelcomeDialog from './WelcomeDialog';

function Splash() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4">
      <div className="w-20 h-20 rounded-[1.6rem] bg-gradient-to-br from-brand-rose via-[#E9B7E3] to-brand-lavender shadow-lg shadow-brand-rose/40 flex items-center justify-center">
        <span className="text-3xl">☀️</span>
      </div>
      <p className="text-2xl font-bold text-brand-ink tracking-tight">Chill</p>
      <p className="text-xs text-muted-foreground">On fait quoi aujourd&apos;hui ?</p>
    </div>
  );
}

function AppShell() {
  const tab = useChillStore((s) => s.tab);
  const setTab = useChillStore((s) => s.setTab);
  const onboardingDone = useChillStore((s) => s.onboardingDone);

  // Service worker : web uniquement (pas dans l'APK Capacitor ni hors-ligne)
  useEffect(() => {
    if (IS_OFFLINE) return;
    const w = window as unknown as { Capacitor?: unknown };
    if (w.Capacitor) return;
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const screens = {
    home: <HomeScreen />,
    discover: <DiscoverScreen />,
    outings: <MyOutingsScreen />,
    profile: <ProfileScreen />,
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-rose-soft via-brand-cream to-brand-lavender-soft">
      <div className="relative max-w-[430px] mx-auto min-h-screen bg-brand-cream shadow-2xl shadow-black/5 flex flex-col">
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {screens[tab]}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav current={tab} onChange={setTab} />
        <GeneratorScreen />
        <CollectionDetailSheet />
        <PlaceDetailSheet />
        {!onboardingDone && <WelcomeDialog />}
      </div>
    </div>
  );
}

const emptySubscribe = () => () => undefined;

export default function ChillApp() {
  // Détection d'hydratation sans setState-in-effect
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  useEffect(() => {
    ensureDeviceId();
  }, []);

  if (!mounted) return <Splash />;

  return (
    <CatalogProvider>
      <AppShell />
    </CatalogProvider>
  );
}
