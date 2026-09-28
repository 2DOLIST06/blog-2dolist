'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { subscribeToNewsletter, type NewsletterInterest, type NewsletterSource } from '@/lib/newsletter';
import type { Locale } from '@/lib/i18n/routing';

interface NewsletterCtaProps {
  source: NewsletterSource;
  locale?: Locale;
  interest?: NewsletterInterest;
  region?: string;
  compact?: boolean;
}

export function NewsletterCta({ source, locale = 'fr', interest, region, compact = false }: NewsletterCtaProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preferencesHref, setPreferencesHref] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setSuccessMessage(null);
      setErrorMessage(!email.trim() ? 'Veuillez saisir une adresse email.' : !consent ? 'Votre consentement est nécessaire pour vous inscrire.' : 'Veuillez saisir une adresse email valide.');
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setPreferencesHref(null);
    setErrorMessage(null);
    try {
      const response = await subscribeToNewsletter({
        email: email.trim(), language: locale, source, consent: true, consentTextVersion: 'v1',
        ...(interest ? { interest } : {}), ...(region ? { region } : {})
      });
      const returnedUrl = response.preferences_url ?? response.data?.preferences_url;
      const returnedToken = response.preferences_token ?? response.data?.preferences_token;
      setPreferencesHref(returnedUrl ?? (returnedToken ? `/newsletter/preferences?${new URLSearchParams({ token: returnedToken })}` : null));
      setSuccessMessage('Votre inscription a bien été prise en compte. Consultez votre email pour gérer vos préférences.');
      setEmail('');
      setConsent(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur pendant l’inscription newsletter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`rounded-2xl bg-brand-700 text-white ${compact ? 'p-5' : 'px-6 py-9 sm:px-8'}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`}>Recevez nos prochains guides et idées d’activités</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">Choisissez les activités aériennes et les destinations qui vous intéressent pour recevoir les contenus qui vous correspondent.</p>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className={compact ? '' : 'sm:flex sm:gap-3'}>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium" htmlFor={`${id}-email`}>Adresse email</label>
            <input id={`${id}-email`} type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-70" />
          </div>
          <button type="submit" disabled={isSubmitting} className={`shrink-0 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70 ${compact ? 'mt-4 w-full' : 'mt-4 w-full sm:mt-7 sm:w-auto'}`}>
            {isSubmitting ? 'Inscription…' : 'S’inscrire'}
          </button>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-blue-50">
          <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={isSubmitting} className="mt-0.5 size-4 shrink-0 accent-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" />
          <span>J’accepte de recevoir les actualités et contenus de 2Dolist par email.</span>
        </label>
      </form>
      <div className="mt-3 text-sm" aria-live="polite">
        {successMessage ? <p className="text-blue-50">{successMessage} {preferencesHref ? <Link className="font-semibold underline" href={preferencesHref}>Gérer mes préférences</Link> : null}</p> : null}
        {errorMessage ? <p className="font-medium text-red-100" role="alert">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
