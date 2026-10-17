'use client';

// ============================================================
// Chill — Panneau d'administration (espace équipe)
// Clé d'accès vérifiée côté serveur, puis onglets :
// Lieux / Événements / Collections / Signalements.
// ============================================================

import { useEffect, useState } from 'react';
import { Loader2, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { LOME_CENTER, formatFCFA, uid } from '@/lib/format';
import type {
  CollectionItem,
  EventItem,
  Place,
  PlaceCategory,
  PriceReliability,
  ReportItem,
  SlotKey,
} from '@/lib/types';
import { CATEGORY_LABELS, RELIABILITY_LABELS } from '@/lib/types';
import {
  IS_OFFLINE,
  adminDeleteCollection,
  adminDeleteEvent,
  adminDeletePlace,
  adminDeleteReport,
  adminFetchReports,
  adminSaveCollection,
  adminSaveEvent,
  adminSavePlace,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [PlaceCategory, string][];
const RELIABILITIES = Object.entries(RELIABILITY_LABELS) as [PriceReliability, string][];

const SLOT_OPTIONS: { key: SlotKey; label: string }[] = [
  { key: 'food', label: 'Repas' },
  { key: 'relax', label: 'Détente' },
  { key: 'pause', label: 'Pause gourmande' },
  { key: 'sunset', label: 'Coucher de soleil' },
  { key: 'activity', label: 'Activité' },
  { key: 'night', label: 'Soirée' },
];

function emptyPlace(): Place {
  return {
    id: uid(),
    name: '',
    category: 'restaurant',
    description: '',
    district: 'Lomé',
    address: '',
    priceFrom: 1000,
    priceHint: '',
    rating: 4.0,
    reviewCount: 0,
    imageUrl: '/images/categories/restaurant.jpg',
    latitude: LOME_CENTER.lat,
    longitude: LOME_CENTER.lng,
    phone: '',
    hours: '',
    moods: [],
    slots: [],
    durationHint: '',
    services: [],
    accessNote: '',
    reliability: 'estime',
    lastVerified: new Date().toLocaleDateString('fr-FR'),
    isSponsored: false,
    isPopular: false,
  };
}

function emptyEvent(): EventItem {
  return {
    id: uid(),
    title: '',
    description: '',
    venue: '',
    timeText: '',
    priceLabel: 'Entrée libre',
    imageUrl: '/images/categories/culture.jpg',
    category: 'festival',
  };
}

function emptyCollection(): CollectionItem {
  return {
    id: uid(),
    title: '',
    subtitle: '',
    badge: 'Nouveau',
    coverImage: '/images/cover-budget.jpg',
    isFeatured: false,
    placeIds: [],
  };
}

function reportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const inputCls = 'h-9 rounded-xl border-brand-rose-soft text-[13px]';
const deleteBtnCls =
  'h-11 rounded-2xl border-red-200 text-[13px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600';

function DeleteRowButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Supprimer ${label || 'cet élément'}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-cream text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[320px] rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {label || 'cet élément'} » ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-xl bg-red-500 text-white hover:bg-red-600">
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const adminKey = useChillStore((s) => s.adminKey);
  const setAdminKey = useChillStore((s) => s.setAdminKey);
  const { catalog, refresh } = useCatalog();

  const [keyInput, setKeyInput] = useState('');
  const [checkingKey, setCheckingKey] = useState(false);
  const [activeTab, setActiveTab] = useState('places');
  const [search, setSearch] = useState('');

  // Brouillons de formulaires
  const [placeDraft, setPlaceDraft] = useState<Place | null>(null);
  const [eventDraft, setEventDraft] = useState<EventItem | null>(null);
  const [collectionDraft, setCollectionDraft] = useState<CollectionItem | null>(null);

  // Signalements
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsTick, setReportsTick] = useState(0);

  useEffect(() => {
    if (!open || !adminKey || activeTab !== 'reports') return;
    let cancelled = false;
    const load = async () => {
      setReportsLoading(true);
      const res = await adminFetchReports(adminKey);
      if (cancelled) return;
      setReports(Array.isArray(res) ? (res as ReportItem[]) : []);
      setReportsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, adminKey, activeTab, reportsTick]);

  const offlineBlocked = (): boolean => {
    if (IS_OFFLINE) {
      toast.info('Disponible en ligne uniquement');
      return true;
    }
    return false;
  };

  // ---------- Clé d'accès ----------
  const handleEnterKey = async () => {
    const key = keyInput.trim();
    if (!key || checkingKey) return;
    if (offlineBlocked()) return;
    setCheckingKey(true);
    const res = await adminFetchReports(key);
    setCheckingKey(false);
    if (res !== null) {
      setAdminKey(key);
      toast.success('Accès équipe accordé 🔓');
      setKeyInput('');
    } else {
      toast.error('Clé invalide ou serveur injoignable');
    }
  };

  // ---------- Lieux ----------
  const patchPlace = (patch: Partial<Place>) => setPlaceDraft((d) => (d ? { ...d, ...patch } : d));

  const togglePlaceMood = (key: string) =>
    setPlaceDraft((d) =>
      d ? { ...d, moods: d.moods.includes(key) ? d.moods.filter((x) => x !== key) : [...d.moods, key] } : d,
    );

  const togglePlaceSlot = (key: SlotKey) =>
    setPlaceDraft((d) =>
      d ? { ...d, slots: d.slots.includes(key) ? d.slots.filter((x) => x !== key) : [...d.slots, key] } : d,
    );

  const handleSavePlace = async () => {
    if (!placeDraft) return;
    if (offlineBlocked()) return;
    if (!placeDraft.name.trim()) {
      toast.error('Le nom du lieu est requis');
      return;
    }
    const res = await adminSavePlace(adminKey, placeDraft);
    if (res.ok) {
      refresh();
      toast.success('Fiche mise à jour ✅');
      setPlaceDraft(null);
    } else {
      toast.error(res.error ?? 'Clé invalide');
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (offlineBlocked()) return;
    const ok = await adminDeletePlace(adminKey, id);
    if (ok) {
      refresh();
      toast('Lieu supprimé');
      setPlaceDraft(null);
    } else {
      toast.error('Serveur injoignable ou clé invalide');
    }
  };

  const filteredPlaces = catalog.places.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
  });
  const placeExists = placeDraft ? catalog.places.some((p) => p.id === placeDraft.id) : false;

  // ---------- Événements ----------
  const patchEvent = (patch: Partial<EventItem>) => setEventDraft((d) => (d ? { ...d, ...patch } : d));

  const handleSaveEvent = async () => {
    if (!eventDraft) return;
    if (offlineBlocked()) return;
    if (!eventDraft.title.trim()) {
      toast.error('Le titre de l’événement est requis');
      return;
    }
    const res = await adminSaveEvent(adminKey, eventDraft);
    if (res.ok) {
      refresh();
      toast.success('Événement enregistré ✅');
      setEventDraft(null);
    } else {
      toast.error(res.error ?? 'Clé invalide');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (offlineBlocked()) return;
    const ok = await adminDeleteEvent(adminKey, id);
    if (ok) {
      refresh();
      toast('Événement supprimé');
      setEventDraft(null);
    } else {
      toast.error('Serveur injoignable ou clé invalide');
    }
  };

  // ---------- Collections ----------
  const patchCollection = (patch: Partial<CollectionItem>) =>
    setCollectionDraft((d) => (d ? { ...d, ...patch } : d));

  const toggleCollectionPlace = (id: string) =>
    setCollectionDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        placeIds: d.placeIds.includes(id) ? d.placeIds.filter((x) => x !== id) : [...d.placeIds, id],
      };
    });

  const handleSaveCollection = async () => {
    if (!collectionDraft) return;
    if (offlineBlocked()) return;
    if (!collectionDraft.title.trim()) {
      toast.error('Le titre de la collection est requis');
      return;
    }
    const res = await adminSaveCollection(adminKey, collectionDraft);
    if (res.ok) {
      refresh();
      toast.success('Collection enregistrée ✅');
      setCollectionDraft(null);
    } else {
      toast.error(res.error ?? 'Clé invalide');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (offlineBlocked()) return;
    const ok = await adminDeleteCollection(adminKey, id);
    if (ok) {
      refresh();
      toast('Collection supprimée');
    } else {
      toast.error('Serveur injoignable ou clé invalide');
    }
  };

  // ---------- Signalements ----------
  const handleResolveReport = async (id: string) => {
    if (offlineBlocked()) return;
    const ok = await adminDeleteReport(adminKey, id);
    if (ok) {
      toast('Signalement marqué comme traité');
      setReportsTick((t) => t + 1);
    } else {
      toast.error('Serveur injoignable ou clé invalide');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] max-w-[400px] gap-0 overflow-y-auto rounded-3xl p-5">
          {!adminKey ? (
            <div className="space-y-4">
              <DialogHeader className="items-center text-center">
                <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-rose to-brand-lavender text-xl shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-white" aria-hidden />
                </div>
                <DialogTitle className="text-[16px] font-bold text-brand-ink">Espace équipe</DialogTitle>
                <p className="text-[12px] text-muted-foreground">
                  Réservé à l’équipe Chill : gestion du catalogue et des signalements.
                </p>
              </DialogHeader>
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleEnterKey();
                }}
                placeholder="Clé d’accès équipe"
                aria-label="Clé d’accès équipe"
                className="h-11 rounded-xl border-brand-rose-soft focus-visible:ring-brand-coral"
              />
              <Button
                onClick={() => void handleEnterKey()}
                disabled={checkingKey || keyInput.trim().length === 0}
                className="h-12 w-full rounded-2xl bg-brand-coral font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
              >
                {checkingKey ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Entrer'}
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <DialogHeader>
                <DialogTitle className="text-[15px] font-bold text-brand-ink">Administration</DialogTitle>
              </DialogHeader>
              <TabsList className="mt-2 grid h-auto w-full grid-cols-4 rounded-xl bg-brand-cream p-1">
                <TabsTrigger
                  value="places"
                  className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-coral"
                >
                  Lieux
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-coral"
                >
                  Événements
                </TabsTrigger>
                <TabsTrigger
                  value="collections"
                  className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-coral"
                >
                  Collections
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="rounded-lg text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-coral"
                >
                  Signalements
                </TabsTrigger>
              </TabsList>

              {/* Lieux */}
              <TabsContent value="places" className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un lieu…"
                    className={inputCls}
                  />
                  <Button
                    size="sm"
                    onClick={() => setPlaceDraft(emptyPlace())}
                    className="h-9 shrink-0 rounded-xl bg-brand-coral text-[12px] font-bold text-white hover:bg-brand-coral-deep"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Nouveau lieu
                  </Button>
                </div>
                <ScrollArea className="h-[50vh] rounded-2xl border border-brand-rose-soft/60 bg-white">
                  <div className="divide-y divide-brand-rose-soft/40">
                    {filteredPlaces.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlaceDraft({ ...p })}
                        className="flex w-full items-center gap-2 p-3 text-left hover:bg-brand-cream/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-brand-ink">
                            {p.name}{' '}
                            {p.isSponsored && <Sparkles className="inline h-3 w-3 text-brand-lavender" aria-hidden />}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {CATEGORY_LABELS[p.category]} · {p.district} ·{' '}
                            {p.priceHint || (p.priceFrom === 0 ? 'Gratuit' : `dès ${formatFCFA(p.priceFrom)}`)}
                          </p>
                        </div>
                      </button>
                    ))}
                    {filteredPlaces.length === 0 && (
                      <p className="p-4 text-center text-[12px] text-muted-foreground">Aucun lieu trouvé.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Événements */}
              <TabsContent value="events" className="mt-3 space-y-3">
                <Button
                  size="sm"
                  onClick={() => setEventDraft(emptyEvent())}
                  className="h-9 w-full rounded-xl bg-brand-coral text-[12px] font-bold text-white hover:bg-brand-coral-deep"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Nouvel événement
                </Button>
                <ScrollArea className="h-[50vh] rounded-2xl border border-brand-rose-soft/60 bg-white">
                  <div className="divide-y divide-brand-rose-soft/40">
                    {catalog.events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 p-3">
                        <button type="button" onClick={() => setEventDraft({ ...ev })} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-[13px] font-bold text-brand-ink">{ev.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {ev.timeText} · {ev.venue} · {ev.priceLabel}
                          </p>
                        </button>
                        <DeleteRowButton label={ev.title} onConfirm={() => void handleDeleteEvent(ev.id)} />
                      </div>
                    ))}
                    {catalog.events.length === 0 && (
                      <p className="p-4 text-center text-[12px] text-muted-foreground">Aucun événement.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Collections */}
              <TabsContent value="collections" className="mt-3 space-y-3">
                <Button
                  size="sm"
                  onClick={() => setCollectionDraft(emptyCollection())}
                  className="h-9 w-full rounded-xl bg-brand-coral text-[12px] font-bold text-white hover:bg-brand-coral-deep"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Nouvelle collection
                </Button>
                <ScrollArea className="h-[50vh] rounded-2xl border border-brand-rose-soft/60 bg-white">
                  <div className="divide-y divide-brand-rose-soft/40">
                    {catalog.collections.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => setCollectionDraft({ ...c, placeIds: [...c.placeIds] })}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[13px] font-bold text-brand-ink">
                            {c.title}
                            {c.isFeatured && (
                              <span className="ml-1.5 rounded-full bg-brand-sun/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-ink">
                                À la une
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {c.badge} · {c.placeIds.length} places
                          </p>
                        </button>
                        <DeleteRowButton label={c.title} onConfirm={() => void handleDeleteCollection(c.id)} />
                      </div>
                    ))}
                    {catalog.collections.length === 0 && (
                      <p className="p-4 text-center text-[12px] text-muted-foreground">Aucune collection.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Signalements */}
              <TabsContent value="reports" className="mt-3 space-y-2.5">
                {reportsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-[12.5px] text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement…
                  </div>
                ) : reports.length === 0 ? (
                  <p className="rounded-2xl bg-white p-6 text-center text-[13px] font-semibold text-brand-ink">
                    Aucun signalement 🎉
                  </p>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-brand-ink">{r.placeName}</p>
                          <p className="text-[11.5px] leading-snug text-brand-ink/80">{r.message}</p>
                          <p className="mt-0.5 text-[10.5px] text-muted-foreground">{reportDate(r.createdAt)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleResolveReport(r.id)}
                          className="h-8 shrink-0 rounded-lg border-brand-rose-soft px-2.5 text-[11px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
                        >
                          Marquer traité
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire lieu */}
      <Dialog open={placeDraft !== null} onOpenChange={(o) => { if (!o) setPlaceDraft(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-[400px] gap-0 overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-brand-ink">
              {placeExists ? 'Modifier le lieu' : 'Nouveau lieu'}
            </DialogTitle>
          </DialogHeader>
          {placeDraft && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Nom</p>
                <Input value={placeDraft.name} onChange={(e) => patchPlace({ name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Quartier</p>
                  <Input value={placeDraft.district} onChange={(e) => patchPlace({ district: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Adresse</p>
                  <Input value={placeDraft.address} onChange={(e) => patchPlace({ address: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Prix dès (FCFA)</p>
                  <Input
                    type="number"
                    value={placeDraft.priceFrom}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      patchPlace({ priceFrom: Number.isFinite(v) ? v : 0 });
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Indication prix</p>
                  <Input value={placeDraft.priceHint} onChange={(e) => patchPlace({ priceHint: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Note (0–5)</p>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={placeDraft.rating}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      patchPlace({ rating: Number.isFinite(v) ? v : 0 });
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Nombre d’avis</p>
                  <Input
                    type="number"
                    min={0}
                    value={placeDraft.reviewCount}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      patchPlace({ reviewCount: Number.isFinite(v) ? Math.max(0, v) : 0 });
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Horaires</p>
                  <Input value={placeDraft.hours} onChange={(e) => patchPlace({ hours: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Téléphone</p>
                  <Input value={placeDraft.phone} onChange={(e) => patchPlace({ phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Durée</p>
                  <Input
                    value={placeDraft.durationHint}
                    onChange={(e) => patchPlace({ durationHint: e.target.value })}
                    placeholder="~1h30"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Dernière vérif.</p>
                  <Input value={placeDraft.lastVerified} onChange={(e) => patchPlace({ lastVerified: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Image (URL)</p>
                <div className="flex items-center gap-2.5">
                  <img
                    src={placeDraft.imageUrl}
                    alt="Aperçu"
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <Input value={placeDraft.imageUrl} onChange={(e) => patchPlace({ imageUrl: e.target.value })} className={cn(inputCls, 'flex-1')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Catégorie</p>
                  <Select value={placeDraft.category} onValueChange={(v) => patchPlace({ category: v as PlaceCategory })}>
                    <SelectTrigger className={cn(inputCls, 'w-full')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Fiabilité du prix</p>
                  <Select value={placeDraft.reliability} onValueChange={(v) => patchPlace({ reliability: v as PriceReliability })}>
                    <SelectTrigger className={cn(inputCls, 'w-full')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIABILITIES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Description</p>
                <Textarea
                  rows={3}
                  value={placeDraft.description}
                  onChange={(e) => patchPlace({ description: e.target.value })}
                  className="rounded-xl border-brand-rose-soft text-[13px]"
                />
              </div>

              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Note d’accès</p>
                <Input
                  value={placeDraft.accessNote}
                  onChange={(e) => patchPlace({ accessNote: e.target.value })}
                  placeholder="Ex. À 10 min du marché"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center justify-between rounded-xl bg-brand-cream px-3 py-2">
                  <p className="text-[12px] font-semibold text-brand-ink">Sponsorisé</p>
                  <Switch
                    checked={placeDraft.isSponsored}
                    onCheckedChange={(v) => patchPlace({ isSponsored: v })}
                    aria-label="Sponsorisé"
                    className="data-[state=checked]:bg-brand-coral"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-cream px-3 py-2">
                  <p className="text-[12px] font-semibold text-brand-ink">Populaire</p>
                  <Switch
                    checked={placeDraft.isPopular}
                    onCheckedChange={(v) => patchPlace({ isPopular: v })}
                    aria-label="Populaire"
                    className="data-[state=checked]:bg-brand-coral"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11.5px] font-bold text-brand-ink">Moods</p>
                <div className="flex flex-wrap gap-1.5">
                  {catalog.moods.map((m) => {
                    const active = placeDraft.moods.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePlaceMood(m.key)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-all',
                          active
                            ? 'border-brand-coral bg-brand-coral text-white'
                            : 'border-brand-rose-soft bg-white text-brand-ink hover:border-brand-rose',
                        )}
                      >
                        <span aria-hidden>{m.emoji}</span> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11.5px] font-bold text-brand-ink">Moments (slots)</p>
                <div className="flex flex-wrap gap-1.5">
                  {SLOT_OPTIONS.map((s) => {
                    const active = placeDraft.slots.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePlaceSlot(s.key)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-all',
                          active
                            ? 'border-brand-lavender bg-brand-lavender text-white'
                            : 'border-brand-rose-soft bg-white text-brand-ink hover:border-brand-rose',
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  onClick={() => void handleSavePlace()}
                  className="h-11 rounded-2xl bg-brand-coral font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
                >
                  Enregistrer
                </Button>
                {placeExists && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className={deleteBtnCls}>
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[320px] rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          « {placeDraft.name || 'Ce lieu'} » sera définitivement retiré du catalogue.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDeletePlace(placeDraft.id)}
                          className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire événement */}
      <Dialog open={eventDraft !== null} onOpenChange={(o) => { if (!o) setEventDraft(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-[400px] gap-0 overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-brand-ink">
              {catalog.events.some((e) => e.id === eventDraft?.id) ? 'Modifier l’événement' : 'Nouvel événement'}
            </DialogTitle>
          </DialogHeader>
          {eventDraft && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Titre</p>
                <Input value={eventDraft.title} onChange={(e) => patchEvent({ title: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Lieu</p>
                  <Input value={eventDraft.venue} onChange={(e) => patchEvent({ venue: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Horaires</p>
                  <Input
                    value={eventDraft.timeText}
                    onChange={(e) => patchEvent({ timeText: e.target.value })}
                    placeholder="Dim · 10h – 18h"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Prix</p>
                  <Input
                    value={eventDraft.priceLabel}
                    onChange={(e) => patchEvent({ priceLabel: e.target.value })}
                    placeholder="Entrée libre"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Catégorie</p>
                  <Input value={eventDraft.category} onChange={(e) => patchEvent({ category: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Image (URL)</p>
                <div className="flex items-center gap-2.5">
                  <img
                    src={eventDraft.imageUrl}
                    alt="Aperçu"
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                  <Input
                    value={eventDraft.imageUrl}
                    onChange={(e) => patchEvent({ imageUrl: e.target.value })}
                    className={cn(inputCls, 'flex-1')}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Description</p>
                <Textarea
                  rows={3}
                  value={eventDraft.description}
                  onChange={(e) => patchEvent({ description: e.target.value })}
                  className="rounded-xl border-brand-rose-soft text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  onClick={() => void handleSaveEvent()}
                  className="h-11 rounded-2xl bg-brand-coral font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
                >
                  Enregistrer
                </Button>
                {catalog.events.some((e) => e.id === eventDraft.id) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className={deleteBtnCls}>
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[320px] rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          « {eventDraft.title || 'Cet événement'} » sera définitivement retiré.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDeleteEvent(eventDraft.id)}
                          className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire collection */}
      <Dialog open={collectionDraft !== null} onOpenChange={(o) => { if (!o) setCollectionDraft(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-[400px] gap-0 overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-brand-ink">
              {catalog.collections.some((c) => c.id === collectionDraft?.id) ? 'Modifier la collection' : 'Nouvelle collection'}
            </DialogTitle>
          </DialogHeader>
          {collectionDraft && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Titre</p>
                <Input value={collectionDraft.title} onChange={(e) => patchCollection({ title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Sous-titre</p>
                <Input value={collectionDraft.subtitle} onChange={(e) => patchCollection({ subtitle: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Badge</p>
                  <Input value={collectionDraft.badge} onChange={(e) => patchCollection({ badge: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <p className="mb-1 text-[11.5px] font-bold text-brand-ink">Image de couverture (URL)</p>
                  <Input
                    value={collectionDraft.coverImage}
                    onChange={(e) => patchCollection({ coverImage: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-brand-cream px-3 py-2">
                <p className="text-[12px] font-semibold text-brand-ink">Mettre à la une</p>
                <Switch
                  checked={collectionDraft.isFeatured}
                  onCheckedChange={(v) => patchCollection({ isFeatured: v })}
                  aria-label="À la une"
                  className="data-[state=checked]:bg-brand-coral"
                />
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-bold text-brand-ink">
                  Lieux de la collection ({collectionDraft.placeIds.length})
                </p>
                <ScrollArea className="h-40 rounded-2xl border border-brand-rose-soft/60 bg-white p-2">
                  <div className="space-y-1">
                    {catalog.places.map((p) => {
                      const checked = collectionDraft.placeIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-brand-cream/70"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleCollectionPlace(p.id)}
                            aria-label={p.name}
                            className="data-[state=checked]:border-brand-coral data-[state=checked]:bg-brand-coral"
                          />
                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-brand-ink">
                            {p.name}
                          </span>
                          <span className="shrink-0 text-[10.5px] text-muted-foreground">{p.district}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              <Button
                onClick={() => void handleSaveCollection()}
                className="h-11 w-full rounded-2xl bg-brand-coral font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
              >
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
