import { PostEditorForm } from '@/components/admin/PostEditorForm';

export default function AdminNewPostPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Créer un article</h1>
      <p className="mt-2 text-slate-300">Éditeur complet avec publication et champs SEO.</p>
      <div className="mt-8">
        <PostEditorForm />
      </div>
    </section>
  );
}
