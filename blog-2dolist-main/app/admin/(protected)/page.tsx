import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <section>
      <p className="text-xs uppercase tracking-wider text-brand-500">Espace administrateur</p>
      <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Depuis cet espace, vous pouvez créer et gérer vos articles, préparer les métadonnées SEO, téléverser une image
        et publier vos contenus.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/posts/new" className="rounded-xl border border-slate-700 bg-slate-900 p-5 hover:bg-slate-800">
          <p className="font-semibold">Créer un nouvel article</p>
          <p className="mt-2 text-sm text-slate-400">Éditeur complet avec sections, tags, SEO avancé et image.</p>
        </Link>
        <Link href="/admin/posts" className="rounded-xl border border-slate-700 bg-slate-900 p-5 hover:bg-slate-800">
          <p className="font-semibold">Gérer les articles</p>
          <p className="mt-2 text-sm text-slate-400">Modifier un brouillon, republier ou revoir les métadonnées.</p>
        </Link>
      </div>
    </section>
  );
}
