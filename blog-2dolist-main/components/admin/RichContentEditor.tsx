'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RichContentValue {
  type: 'doc';
  html: string;
}

type ActiveFormats = {
  block: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  link: boolean;
};

const emptyFormats: ActiveFormats = {
  block: 'p',
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  link: false
};

const toolbarButton =
  'rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500/50';
const inactiveButton = 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400 hover:bg-slate-800';
const activeButton = 'border-brand-400 bg-brand-700 text-white shadow shadow-brand-950/30';

const getNodeTagName = (node: Node | null) => {
  if (!node) return '';
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return element?.tagName.toLowerCase() ?? '';
};

const getSelectionElement = () => {
  const selection = document.getSelection();
  const node = selection?.anchorNode;
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
};

const selectionHasLink = () => Boolean(getSelectionElement()?.closest('a'));

const getSelectedImage = () => {
  const closest = getSelectionElement()?.closest('img, figure');
  if (!closest) return null;
  return closest.tagName.toLowerCase() === 'img' ? (closest as HTMLImageElement) : closest.querySelector('img');
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function RichContentEditor({
  value,
  onChange,
  onUploadImage
}: {
  value: RichContentValue;
  onChange: (value: RichContentValue) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyFormats);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value.html) ref.current.innerHTML = value.html;
  }, [value.html]);

  const emit = useCallback(() => onChange({ type: 'doc', html: ref.current?.innerHTML ?? '' }), [onChange]);

  const saveSelection = useCallback(() => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (ref.current?.contains(range.commonAncestorContainer)) savedSelection.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    ref.current?.focus();
    const selection = document.getSelection();
    if (!selection || !savedSelection.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelection.current);
  }, []);

  const refreshActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return;

    const selection = document.getSelection();
    const anchorNode = selection?.anchorNode ?? null;
    if (!anchorNode || !ref.current?.contains(anchorNode)) {
      setActiveFormats((current) => ({ ...current, block: current.block || 'p' }));
      return;
    }

    let block = 'p';
    const formatBlock = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
    if (formatBlock) block = formatBlock.replace(/[<>]/g, '');
    if (!block) block = getNodeTagName(anchorNode) || 'p';

    setActiveFormats({
      block,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      link: selectionHasLink()
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActiveFormats);
    return () => document.removeEventListener('selectionchange', refreshActiveFormats);
  }, [refreshActiveFormats]);

  const exec = (cmd: string, valueArg?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, valueArg);
    saveSelection();
    emit();
    refreshActiveFormats();
  };

  const addLink = () => {
    saveSelection();
    const selectedText = document.getSelection()?.toString().trim();
    const url = window.prompt('URL du lien (https://...)');
    if (!url) return;
    restoreSelection();
    if (selectedText) document.execCommand('createLink', false, url);
    else document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>`);
    emit();
    refreshActiveFormats();
  };

  const insertImage = (url: string, alt = '') => {
    const safeUrl = escapeHtmlAttribute(url.trim());
    if (!safeUrl) return;
    const safeAlt = escapeHtmlAttribute(alt.trim());
    exec(
      'insertHTML',
      `<figure><img src="${safeUrl}" alt="${safeAlt}" /><figcaption>${safeAlt}</figcaption></figure><p><br></p>`
    );
  };

  const editSelectedImageAlt = () => {
    saveSelection();
    const image = getSelectedImage();
    if (!image || !ref.current?.contains(image)) {
      setUploadError('Cliquez d’abord sur une image dans le contenu pour modifier sa balise alt.');
      return;
    }

    const currentAlt = image.getAttribute('alt') ?? '';
    const nextAlt = window.prompt('Texte alternatif de l’image', currentAlt);
    if (nextAlt === null) return;

    image.setAttribute('alt', nextAlt.trim());
    const figure = image.closest('figure');
    const figcaption = figure?.querySelector('figcaption');
    if (figcaption) figcaption.textContent = nextAlt.trim();
    setUploadError('');
    emit();
    saveSelection();
  };

  const addImageByUrl = () => {
    saveSelection();
    const url = window.prompt('URL de l’image (https://...)');
    if (!url) return;
    const alt = window.prompt('Texte alternatif / légende (optionnel)') ?? '';
    restoreSelection();
    setUploadError('');
    insertImage(url, alt);
  };

  const uploadImageFile = async (file?: File) => {
    setUploadError('');

    if (!file) {
      setUploadError('Aucun fichier image sélectionné.');
      return;
    }

    if (!onUploadImage) {
      setUploadError('Upload image indisponible: aucun endpoint backend n’est configuré pour cet éditeur.');
      return;
    }

    setUploading(true);
    try {
      const alt = window.prompt('Texte alternatif de l’image', file.name);
      if (alt === null) return;
      const uploaded = await onUploadImage(file);
      insertImage(uploaded.url, alt || uploaded.alt || file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload image impossible.');
    } finally {
      setUploading(false);
    }
  };

  const buttonClass = (active = false) => `${toolbarButton} ${active ? activeButton : inactiveButton}`;
  const isBlock = (tag: string) => activeFormats.block === tag.toLowerCase();
  const contentHtml = useMemo(() => value.html, [value.html]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-black/20">
      <div className="sticky top-24 z-30 flex flex-wrap items-center gap-2 rounded-t-xl border-b border-slate-700 bg-slate-900/95 p-3 shadow-lg shadow-slate-950/20 backdrop-blur">
        <button type="button" className={buttonClass(isBlock('p'))} onClick={() => exec('formatBlock', 'P')}>Paragraphe</button>
        <button type="button" className={buttonClass(isBlock('h1'))} onClick={() => exec('formatBlock', 'H1')}>H1</button>
        <button type="button" className={buttonClass(isBlock('h2'))} onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button type="button" className={buttonClass(isBlock('h3'))} onClick={() => exec('formatBlock', 'H3')}>H3</button>
        <button type="button" className={buttonClass(isBlock('h4'))} onClick={() => exec('formatBlock', 'H4')}>H4</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.bold)} onClick={() => exec('bold')}>Gras</button>
        <button type="button" className={buttonClass(activeFormats.italic)} onClick={() => exec('italic')}>Italique</button>
        <button type="button" className={buttonClass(activeFormats.underline)} onClick={() => exec('underline')}>Souligné</button>
        <button type="button" className={buttonClass(activeFormats.strikeThrough)} onClick={() => exec('strikeThrough')}>Barré</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.insertUnorderedList)} onClick={() => exec('insertUnorderedList')}>Puces</button>
        <button type="button" className={buttonClass(activeFormats.insertOrderedList)} onClick={() => exec('insertOrderedList')}>Numérotée</button>
        <button type="button" className={buttonClass(isBlock('blockquote'))} onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>Citation</button>
        <button type="button" className={buttonClass(isBlock('pre'))} onClick={() => exec('formatBlock', 'PRE')}>Code</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.justifyLeft)} onClick={() => exec('justifyLeft')}>Gauche</button>
        <button type="button" className={buttonClass(activeFormats.justifyCenter)} onClick={() => exec('justifyCenter')}>Centrer</button>
        <button type="button" className={buttonClass(activeFormats.justifyRight)} onClick={() => exec('justifyRight')}>Droite</button>
        <button type="button" className={buttonClass()} onClick={() => exec('outdent')}>- Retrait</button>
        <button type="button" className={buttonClass()} onClick={() => exec('indent')}>+ Retrait</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass()} onClick={() => exec('insertHorizontalRule')}>Ligne</button>
        <button type="button" className={buttonClass(activeFormats.link)} onClick={addLink}>Lien</button>
        <button type="button" className={buttonClass()} onClick={() => exec('unlink')}>Retirer lien</button>
        <button type="button" className={buttonClass()} onClick={addImageByUrl}>Image URL</button>
        <button type="button" className={buttonClass()} onClick={() => { saveSelection(); fileInputRef.current?.click(); }}>Image fichier</button>
        <button type="button" className={buttonClass()} onClick={editSelectedImageAlt}>Alt image</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = '';
            await uploadImageFile(file);
          }}
        />
        <button type="button" className={buttonClass()} onClick={() => exec('insertHTML', '<br>')}>Saut ligne</button>
        <button type="button" className={buttonClass()} onClick={() => exec('removeFormat')}>Nettoyer</button>
        <button type="button" className={buttonClass()} onClick={() => exec('undo')}>Undo</button>
        <button type="button" className={buttonClass()} onClick={() => exec('redo')}>Redo</button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[520px] w-full bg-white p-8 text-base leading-8 text-slate-900 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500 [&_figure]:my-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6"
        onBlur={saveSelection}
        onInput={() => {
          emit();
          saveSelection();
          refreshActiveFormats();
        }}
        onKeyUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        onMouseUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
      />
      {uploadError ? <p className="border-t border-red-900 bg-red-950/70 px-3 py-2 text-xs text-red-100">{uploadError}</p> : null}
      <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
        <span>{uploading ? 'Upload image en cours…' : `${contentHtml.length} caractères HTML`}</span>
        <span>Format courant : {activeFormats.block.toUpperCase()}{activeFormats.link ? ' · lien' : ''}</span>
      </div>
    </div>
  );
}
