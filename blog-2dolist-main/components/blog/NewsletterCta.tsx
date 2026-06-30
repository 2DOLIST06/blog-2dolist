'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/newsletter';
import type { Locale } from '@/lib/i18n/routing';

interface NewsletterCtaProps {
  source?: string;
  locale?: Locale;
}

export function NewsletterCta({ source = 'home', locale = 'fr' }: NewsletterCtaProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const copy = locale === 'fr'
    ? {
        title: 'Newsletter',
        text: 'Recevez un résumé hebdomadaire des derniers contenus publiés sur le blog.',
        label: 'Adresse e-mail',
        placeholder: 'Votre email',
        button: 'S’inscrire',
        submitting: 'Inscription…',
        emptyEmail: 'Veuillez saisir une adresse e-mail.',
        invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
        alreadySubscribed: 'Cette adresse est déjà inscrite à la newsletter.',
        success: 'Inscription newsletter reçue.',
        error: 'Erreur pendant l’inscription newsletter.'
      }
    : {
        title: 'Newsletter',
        text: 'Get a weekly summary of the latest content published on the blog.',
        label: 'Email address',
        placeholder: 'Your email',
        button: 'Subscribe',
        submitting: 'Subscribing…',
        emptyEmail: 'Please enter an email address.',
        invalidEmail: 'Please enter a valid email address.',
        alreadySubscribed: 'This address is already subscribed to the newsletter.',
        success: 'Newsletter subscription received.',
        error: 'Error during newsletter signup.'
      };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setSuccessMessage(null);
      setErrorMessage(copy.emptyEmail);
      return;
    }

    if (!event.currentTarget.checkValidity()) {
      setSuccessMessage(null);
      setErrorMessage(copy.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = await subscribeToNewsletter(normalizedEmail, source);

      if (payload.data?.alreadySubscribed) {
        setSuccessMessage(copy.alreadySubscribed);
      } else {
        setSuccessMessage(payload.message || copy.success);
      }

      setEmail('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl bg-brand-700 px-6 py-10 text-white">
      <h2 className="text-2xl font-bold">{copy.title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-blue-100">
        {copy.text}
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="newsletter-email">
          {copy.label}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder={copy.placeholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-blue-300 bg-white/95 px-4 py-3 text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? copy.submitting : copy.button}
        </button>
      </form>
      <div className="mt-3 text-sm" aria-live="polite">
        {successMessage ? <p className="text-blue-50">{successMessage}</p> : null}
        {errorMessage ? <p className="font-medium text-red-100">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
