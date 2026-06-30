import type { PostFaq } from '@/types/content';

type FaqSectionProps = {
  faqs: PostFaq[];
  title: string;
};

export function FaqSection({ faqs, title }: FaqSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 space-y-4">
        {faqs.map((faq) => (
          <details key={faq.question} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm" open>
            <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900 marker:hidden">
              <span>{faq.question}</span>
            </summary>
            <p className="mt-3 leading-7 text-slate-700 whitespace-pre-line">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
