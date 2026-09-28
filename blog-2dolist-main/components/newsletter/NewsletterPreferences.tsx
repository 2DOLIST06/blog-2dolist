'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getNewsletterPreferences, getNewsletterRegions, NEWSLETTER_CONTENT_TYPES, NEWSLETTER_INTERESTS,
  unsubscribeFromNewsletter, updateNewsletterPreferences,
  type NewsletterContentType, type NewsletterFrequency, type NewsletterInterest, type NewsletterPreferences,
  type NewsletterRegion
} from '@/lib/newsletter';

const activityLabels: Record<NewsletterInterest, string> = {
  airplane: 'Avion', ulm: 'ULM', parachuting: 'Parachute', paragliding: 'Parapente',
  paramotor: 'Paramoteur', helicopter: 'Hélicoptère', hot_air_balloon: 'Montgolfière', gliding: 'Planeur'
};
const contentLabels: Record<NewsletterContentType, string> = {
  new_articles: 'Nouveaux articles', practical_guides: 'Guides pratiques', destination_guides: 'Guides par destination',
  activity_guides: 'Guides sur les activités', news_and_updates: 'Actualités et nouveautés'
};
const frequencies: Array<{ value: NewsletterFrequency; label: string }> = [
  { value: 'immediate', label: 'Dès qu’un nouveau contenu correspondant à mes préférences est publié' },
  { value: 'weekly', label: 'Une fois par semaine' },
  { value: 'monthly', label: 'Une fois par mois' }
];

const toggleValue = <T extends string>(values: T[], value: T) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export function NewsletterPreferencesCenter({ token, confirmUnsubscribe }: { token: string; confirmUnsubscribe: boolean }) {
  const [preferences, setPreferences] = useState<NewsletterPreferences | null>(null);
  const [draft, setDraft] = useState<NewsletterPreferences | null>(null);
  const [regions, setRegions] = useState<NewsletterRegion[]>([]);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [regionQuery, setRegionQuery] = useState('');
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNewsletterPreferences(token)
      .then((result) => { if (active) { setPreferences(result); setDraft(result); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Impossible de charger vos préférences.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const availableRegions = useMemo(() => regions.filter((region) =>
    !draft?.regions.some((selected) => selected.id === region.id) && region.name.toLocaleLowerCase('fr').includes(regionQuery.toLocaleLowerCase('fr'))
  ), [draft?.regions, regionQuery, regions]);

  const openRegionPicker = async () => {
    setShowRegionPicker(true);
    if (regions.length) return;
    setLoadingRegions(true);
    setError(null);
    try { setRegions(await getNewsletterRegions()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de charger les régions.'); }
    finally { setLoadingRegions(false); }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true); setMessage(null); setError(null);
    try {
      const saved = await updateNewsletterPreferences(token, {
        interests: draft.interests, contentTypes: draft.contentTypes,
        regions: draft.regions.map((region) => region.id), frequency: draft.frequency
      });
      setPreferences(saved); setDraft(saved);
      setMessage('Vos préférences ont bien été enregistrées.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer vos préférences.');
    } finally { setSaving(false); }
  };

  const unsubscribe = async () => {
    setUnsubscribing(true); setMessage(null); setError(null);
    try { await unsubscribeFromNewsletter(token); setUnsubscribed(true); setMessage('Vous êtes maintenant désabonné de la newsletter.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de vous désabonner.'); }
    finally { setUnsubscribing(false); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600" role="status">Chargement de vos préférences…</div>;
  if (error && !draft) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8" role="alert"><h2 className="font-semibold text-red-900">Lien de préférences invalide</h2><p className="mt-2 text-red-800">{error}</p></div>;
  if (!draft || !preferences) return null;
  if (unsubscribed) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8" role="status"><h2 className="text-xl font-semibold text-emerald-900">Désinscription confirmée</h2><p className="mt-2 text-emerald-800">{message}</p></div>;

  return (
    <div className="space-y-8">
      {confirmUnsubscribe ? <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="unsubscribe-confirm-title"><h2 id="unsubscribe-confirm-title" className="font-semibold text-amber-950">Confirmer votre désinscription</h2><p className="mt-1 text-sm text-amber-900">Vous ne serez désabonné qu’après avoir cliqué sur le bouton de confirmation en bas de cette page.</p></section> : null}
      <p className="text-sm text-slate-600">Préférences de <strong className="text-slate-900">{preferences.email}</strong></p>

      <PreferenceSection title="Les activités qui m’intéressent">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NEWSLETTER_INTERESTS.map((activity) => { const selected = draft.interests.includes(activity); return <button key={activity} type="button" aria-pressed={selected} onClick={() => setDraft({ ...draft, interests: toggleValue(draft.interests, activity) })} className={`rounded-xl border px-3 py-3 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-brand-200 ${selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-500'}`}>{activityLabels[activity]}</button>; })}
        </div>
      </PreferenceSection>

      <PreferenceSection title="Ce que je souhaite recevoir">
        <div className="flex flex-wrap gap-3">
          {NEWSLETTER_CONTENT_TYPES.map((type) => { const selected = draft.contentTypes.includes(type); return <button key={type} type="button" aria-pressed={selected} onClick={() => setDraft({ ...draft, contentTypes: toggleValue(draft.contentTypes, type) })} className={`rounded-full border px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-4 focus-visible:ring-brand-200 ${selected ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-300 bg-white text-slate-700'}`}>{contentLabels[type]}<span className="sr-only"> : {selected ? 'sélectionné' : 'non sélectionné'}</span></button>; })}
        </div>
      </PreferenceSection>

      <PreferenceSection title="Les régions qui m’intéressent">
        <h3 className="text-sm font-semibold text-slate-700">Mes régions</h3>
        <div className="mt-3 flex flex-wrap gap-2">{draft.regions.length ? draft.regions.map((region) => <span key={region.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-800">{region.name}<button type="button" aria-label={`Supprimer ${region.name}`} onClick={() => setDraft({ ...draft, regions: draft.regions.filter((item) => item.id !== region.id) })} className="rounded-full text-lg leading-none outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-brand-500">×</button></span>) : <p className="text-sm text-slate-500">Aucune région sélectionnée.</p>}</div>
        <button type="button" onClick={openRegionPicker} className="mt-4 rounded-lg border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-200">+ Ajouter une région</button>
        {showRegionPicker ? <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-slate-50 p-4"><label htmlFor="region-search" className="text-sm font-medium text-slate-800">Rechercher une région</label><input id="region-search" value={regionQuery} onChange={(event) => setRegionQuery(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus-visible:ring-4 focus-visible:ring-brand-200" autoComplete="off" />{loadingRegions ? <p className="mt-3 text-sm text-slate-500" role="status">Chargement des régions…</p> : <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">{availableRegions.map((region) => <button key={region.id} type="button" onClick={() => { setDraft({ ...draft, regions: [...draft.regions, region] }); setRegionQuery(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">{region.name}</button>)}</div>}</div> : null}
      </PreferenceSection>

      <PreferenceSection title="À quelle fréquence souhaitez-vous recevoir nos contenus ?">
        <div className="grid gap-3">{frequencies.map(({ value, label }) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.frequency === value ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}><input type="radio" name="frequency" value={value} checked={draft.frequency === value} onChange={() => setDraft({ ...draft, frequency: value })} className="mt-1 accent-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500" /><span className="text-sm font-medium text-slate-800">{label}</span></label>)}</div>
      </PreferenceSection>

      <div aria-live="polite">{message ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{message}</p> : null}{error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">{error}</p> : null}</div>
      <button type="button" disabled={saving} onClick={save} className="w-full rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white outline-none hover:bg-brand-800 focus-visible:ring-4 focus-visible:ring-brand-200 disabled:opacity-60 sm:w-auto">{saving ? 'Enregistrement…' : 'Enregistrer mes préférences'}</button>
      <section className="border-t border-slate-200 pt-8"><h2 className="font-semibold text-slate-900">Se désabonner</h2><p className="mt-1 text-sm text-slate-600">Cette action nécessite votre confirmation explicite.</p><button type="button" disabled={unsubscribing} onClick={unsubscribe} className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 outline-none hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-60">{unsubscribing ? 'Désinscription…' : 'Confirmer le désabonnement'}</button></section>
    </div>
  );
}

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>{children}</section>;
}
