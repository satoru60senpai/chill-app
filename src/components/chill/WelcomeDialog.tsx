'use client';

// ============================================================
// Chill — Dialog de bienvenue (prénom + avatar + budget habituel)
// Aucun compte requis : profil léger stocké sur l'appareil.
// ============================================================

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChillStore } from '@/lib/store';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';

const AVATARS = ['🌸', '🌴', '☀️', '🦋', '🎧', '💫', '🍓', '🌊', '🎉', '🐨', '🔥', '🫶'];
const BUDGETS = [3000, 6000, 10000];

export default function WelcomeDialog() {
  const setProfile = useChillStore((s) => s.setProfile);
  const setOnboardingDone = useChillStore((s) => s.setOnboardingDone);
  const defaultBudget = useChillStore((s) => s.profile.defaultBudget);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🌸');
  const [budget, setBudget] = useState(defaultBudget);

  const finish = () => {
    setProfile({ name: name.trim(), avatar, defaultBudget: budget });
    setOnboardingDone(true);
    toast.success(`Coucou ${name.trim() || 'toi'} ! Prêt·e à sortir ? 🎉`);
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-[380px] rounded-3xl bg-white p-6 gap-0 border-0" showCloseButton={false}>
        <DialogHeader className="items-center text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-rose via-[#E9B7E3] to-brand-lavender shadow-md shadow-brand-rose/30 flex items-center justify-center mb-2">
            <span className="text-2xl" aria-hidden>
              ☀️
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-brand-ink">Bienvenue sur Chill !</DialogTitle>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Des idées de sorties à Lomé, adaptées à ton mood et ton budget. Aucun compte requis 💛
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="welcome-name" className="text-[12.5px] font-bold text-brand-ink mb-1.5 block">
              Ton prénom (facultatif)
            </label>
            <Input
              id="welcome-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Awa"
              maxLength={20}
              className="rounded-xl border-brand-rose-soft focus-visible:ring-brand-coral h-11"
            />
          </div>

          <div>
            <p className="text-[12.5px] font-bold text-brand-ink mb-1.5">Choisis ton avatar</p>
            <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Avatar">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={avatar === a}
                  onClick={() => setAvatar(a)}
                  className={cn(
                    'h-10 rounded-xl text-lg transition-all active:scale-90',
                    avatar === a ? 'bg-brand-rose-soft ring-2 ring-brand-coral' : 'bg-brand-cream hover:bg-brand-rose-soft/60',
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12.5px] font-bold text-brand-ink mb-1.5">Ton budget habituel par sortie</p>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Budget habituel">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={budget === b}
                  onClick={() => setBudget(b)}
                  className={cn(
                    'h-10 rounded-xl text-[12.5px] font-bold transition-all active:scale-95',
                    budget === b
                      ? 'bg-brand-coral text-white ring-2 ring-brand-coral/40'
                      : 'bg-brand-cream text-brand-ink hover:bg-brand-rose-soft/60',
                  )}
                >
                  {formatFCFA(b).replace(' FCFA', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={finish}
          className="mt-6 w-full h-12 rounded-2xl bg-brand-coral hover:bg-brand-coral-deep text-white font-bold text-[15px] shadow-md shadow-brand-coral/30"
        >
          C&apos;est parti ! 🎲
        </Button>
        <button
          type="button"
          onClick={finish}
          className="mt-2 text-[12px] text-muted-foreground hover:text-brand-ink transition-colors"
        >
          Explorer sans personnaliser
        </button>
      </DialogContent>
    </Dialog>
  );
}
