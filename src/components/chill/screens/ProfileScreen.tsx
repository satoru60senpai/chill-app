'use client';

// ============================================================
// Chill — Écran « Profil » : identité, favoris, paramètres,
// à propos légal et accès à l'espace équipe (AdminPanel).
// ============================================================

import { useState } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useChillStore } from '@/lib/store';
import { useCatalog } from '@/lib/catalog';
import { formatFCFA, formatK } from '@/lib/format';
import { IS_OFFLINE } from '@/lib/api';
import type { Place } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { FavButton, PriceLabel, SectionHeader } from '@/components/chill/ui-bits';
import AdminPanel from '@/components/chill/AdminPanel';
import { cn } from '@/lib/utils';

const AVATARS = ['🌸', '🌴', '☀️', '🦋', '🎧', '💫', '🍓', '🌊', '🎉', '🐨', '🔥', '🫶'];

export default function ProfileScreen() {
  const profile = useChillStore((s) => s.profile);
  const setProfile = useChillStore((s) => s.setProfile);
  const favorites = useChillStore((s) => s.favorites);
  const toggleFavorite = useChillStore((s) => s.toggleFavorite);
  const plans = useChillStore((s) => s.plans);
  const openPlace = useChillStore((s) => s.openPlace);
  const { getPlace } = useCatalog();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('🌸');
  const [editBudget, setEditBudget] = useState(6000);
  const [legalOpen, setLegalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const favoritePlaces = favorites.map((id) => getPlace(id)).filter((p): p is Place => p !== undefined);
  const doneCount = plans.filter((p) => p.status === 'done').length;
  const avgBudget =
    plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.budgetPerPerson, 0) / plans.length) : null;

  const openEdit = () => {
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setEditBudget(profile.defaultBudget);
    setEditOpen(true);
  };

  const saveProfile = () => {
    setProfile({ name: editName.trim(), avatar: editAvatar, defaultBudget: editBudget });
    toast.success('Profil mis à jour ✨');
    setEditOpen(false);
  };

  const handleNotif = (v: boolean) => {
    setProfile({ notifEnabled: v });
    toast(v ? 'Rappels activés 🔔' : 'Rappels désactivés');
  };

  const handleAdmin = () => {
    if (IS_OFFLINE) {
      toast.info('Administration disponible sur la version web connectée');
      return;
    }
    setAdminOpen(true);
  };

  const stats: { value: string; label: string }[] = [
    { value: String(favorites.length), label: 'Favoris' },
    { value: String(plans.length), label: 'Sorties' },
    { value: String(doneCount), label: 'Terminées' },
    { value: avgBudget !== null ? formatK(avgBudget) : '—', label: 'Budget moy.' },
  ];

  return (
    <div className="pb-28 pt-6">
      <div className="px-4">
        <h1 className="text-[22px] font-bold text-brand-ink">Profil</h1>

        {/* Carte profil */}
        <div className="mt-4 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-rose to-brand-lavender text-3xl shadow-sm">
            <span aria-hidden>{profile.avatar}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-[16px] font-bold',
                profile.name ? 'text-brand-ink' : 'italic text-muted-foreground',
              )}
            >
              {profile.name || 'Anonyme sympa'}
            </p>
            <p className="text-[12px] text-muted-foreground">📍 {profile.city}, Togo</p>
          </div>
          <button
            type="button"
            onClick={openEdit}
            aria-label="Modifier le profil"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream transition-transform active:scale-95"
          >
            <Pencil className="h-4 w-4 text-brand-ink" aria-hidden />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-2.5 text-center shadow-sm">
              <p className="text-[15px] font-bold leading-tight text-brand-coral">{s.value}</p>
              <p className="mt-0.5 text-[9.5px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Favoris */}
      <SectionHeader
        title="Favoris"
        emoji="❤️"
        actionLabel={favoritePlaces.length > 0 ? 'Gérer' : undefined}
        onAction={() => toast('Appuie sur ♥ dans les fiches pour modifier')}
      />
      <div className="px-4">
        {favoritePlaces.length === 0 ? (
          <div className="rounded-2xl border border-brand-rose-soft/60 bg-brand-cream p-4">
            <p className="text-[12.5px] text-muted-foreground">
              Aucun favori pour l’instant — appuie sur ♥ sur une fiche.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {favoritePlaces.map((place) => (
              <div
                key={place.id}
                role="button"
                tabIndex={0}
                onClick={() => openPlace(place.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPlace(place.id);
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-brand-ink">{place.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{place.district}</p>
                  <PriceLabel place={place} />
                </div>
                <FavButton
                  active
                  onToggle={() => {
                    const added = toggleFavorite(place.id);
                    toast(added ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paramètres */}
      <div className="mt-6 px-4">
        <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-brand-ink">Rappels week-end</p>
              <p className="text-[11px] text-muted-foreground">Une idée de sortie chaque vendredi</p>
            </div>
            <Switch
              checked={profile.notifEnabled}
              onCheckedChange={handleNotif}
              aria-label="Rappels week-end"
              className="data-[state=checked]:bg-brand-coral"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-brand-ink">Ville</p>
            <span className="rounded-full bg-brand-cream px-2.5 py-1 text-[11px] font-bold text-brand-ink">
              {profile.city}
            </span>
          </div>
        </div>
      </div>

      {/* À propos */}
      <div className="mt-4 px-4">
        <div className="rounded-3xl bg-brand-cream p-5 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-rose via-[#E9B7E3] to-brand-lavender shadow-sm">
            <span className="text-xl" aria-hidden>
              ☀️
            </span>
          </div>
          <p className="mt-2 text-[15px] font-bold text-brand-ink">Chill</p>
          <p className="text-[11px] text-muted-foreground">v1.0.0 — MVP Lomé</p>
          <p className="text-[11px] text-muted-foreground">ND Software Studio · Lomé, Togo</p>
          <div className="mt-2.5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-brand-ink"
            >
              Politique de confidentialité
            </button>
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-brand-ink"
            >
              Conditions d’utilisation
            </button>
          </div>
        </div>
      </div>

      {/* Espace équipe */}
      <div className="mt-4 px-4">
        <Button
          variant="outline"
          onClick={handleAdmin}
          className="h-12 w-full rounded-2xl border-brand-rose-soft text-[13px] font-bold text-brand-ink hover:bg-brand-rose-soft/40"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Espace équipe · Administration
        </Button>
      </div>

      {/* Dialog édition profil */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[360px] gap-0 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-brand-ink">Modifier mon profil</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-[12.5px] font-bold text-brand-ink">
                Prénom
              </label>
              <Input
                id="profile-name"
                value={editName}
                maxLength={20}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex. Awa"
                className="h-11 rounded-xl border-brand-rose-soft focus-visible:ring-brand-coral"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[12.5px] font-bold text-brand-ink">Avatar</p>
              <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Avatar">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={editAvatar === a}
                    onClick={() => setEditAvatar(a)}
                    className={cn(
                      'h-10 rounded-xl text-lg transition-all active:scale-90',
                      editAvatar === a ? 'bg-brand-rose-soft ring-2 ring-brand-coral' : 'bg-brand-cream hover:bg-brand-rose-soft/60',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-bold text-brand-ink">Budget habituel par sortie</p>
                <span className="text-[12px] font-bold text-brand-coral">{formatFCFA(editBudget)}</span>
              </div>
              <Slider
                min={1000}
                max={15000}
                step={500}
                value={[editBudget]}
                onValueChange={(v) => setEditBudget(v[0] ?? editBudget)}
                aria-label="Budget habituel par sortie"
                className="[&_[data-slot=slider-range]]:bg-brand-coral [&_[data-slot=slider-thumb]]:border-brand-coral"
              />
            </div>
            <Button
              onClick={saveProfile}
              className="h-12 w-full rounded-2xl bg-brand-coral font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-coral-deep"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog légal */}
      <Dialog open={legalOpen} onOpenChange={setLegalOpen}>
        <DialogContent className="max-h-[70dvh] max-w-[380px] gap-0 overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-brand-ink">Informations légales</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4 text-[12.5px] leading-relaxed text-brand-ink/85">
            <section>
              <h3 className="mb-1 text-[13px] font-bold text-brand-ink">Politique de confidentialité</h3>
              <p>
                Chill fonctionne sans compte : ton profil, tes favoris et tes sorties sont enregistrés uniquement sur
                ton appareil (stockage local du navigateur). Aucune donnée personnelle n’est revendue ni transmise à
                des tiers. Ta position ne sert qu’à calculer des distances jusqu’aux lieux et n’est jamais stockée.
              </p>
            </section>
            <section>
              <h3 className="mb-1 text-[13px] font-bold text-brand-ink">Conditions d’utilisation</h3>
              <p>
                Les prix et horaires affichés sont indicatifs, exprimés en FCFA, et peuvent évoluer sans préavis :
                vérifie toujours auprès de l’établissement avant de te déplacer. Chill ne peut être tenu responsable
                des prestations, tarifs ou services des établissements listés. Une question ? Contacte ND Software
                Studio · Lomé, Togo.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Panneau d'administration (gère lui-même la clé) */}
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </div>
  );
}
