import Image from 'next/image';
import type { Author } from '@/types/content';

export function AuthorBox({ author }: { author: Author }) {
  const bio = author.bio.trim() === 'Auteur.' ? '' : author.bio.trim();
  return (
    <aside className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-4">
        <Image src={author.avatar} alt={author.name} width={56} height={56} className="rounded-full object-cover" />
        <div>
          <p className="font-semibold text-slate-900">{author.name}</p>
          <p className="text-sm text-slate-600">{author.role}</p>
        </div>
      </div>
      {bio ? <p className="mt-3 text-sm text-slate-700">{bio}</p> : null}
    </aside>
  );
}
