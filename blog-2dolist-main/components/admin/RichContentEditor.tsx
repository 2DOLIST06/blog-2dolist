'use client';

import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RichContentValue {
  type: 'doc';
  html: string;
  blocks?: RichContentBlock[];
}

type RichContentBlock = Record<string, unknown> & {
  id?: string;
  type?: string;
  html?: string;
  content?: string;
  value?: string;
  markup?: string;
  rawHtml?: string;
  body?: string;
  label?: string;
};

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

const MAX_EDITOR_IMAGE_WIDTH = 1600;
const MAX_EDITOR_IMAGE_HEIGHT = 1600;
const EDITOR_IMAGE_JPEG_QUALITY = 0.82;

const getImageNaturalSize = (image: HTMLImageElement) => ({
  width: image.naturalWidth || image.width || image.clientWidth || 0,
  height: image.naturalHeight || image.height || image.clientHeight || 0
});

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const resizeImageFile = (file: File) =>
  new Promise<File>((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || typeof window === 'undefined') {
      resolve(file);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = Math.min(1, MAX_EDITOR_IMAGE_WIDTH / image.naturalWidth, MAX_EDITOR_IMAGE_HEIGHT / image.naturalHeight);
      const nextWidth = Math.round(image.naturalWidth * ratio);
      const nextHeight = Math.round(image.naturalHeight * ratio);

      if (ratio >= 1 && file.size <= 1024 * 1024) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(file);
        return;
      }

      context.drawImage(image, 0, 0, nextWidth, nextHeight);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const extension = outputType === 'image/jpeg' ? 'jpg' : 'png';
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
          resolve(new File([blob], `${baseName}-optimisee.${extension}`, { type: outputType, lastModified: Date.now() }));
        },
        outputType,
        EDITOR_IMAGE_JPEG_QUALITY
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    image.src = objectUrl;
  });

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

const sanitizeCustomHtmlBlock = (html: string) => {
  if (typeof window === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script').forEach((node) => node.remove());
  template.content.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return template.innerHTML.trim();
};

const getSelectedHtmlBlock = (root: HTMLElement | null) => {
  const block = getSelectionElement()?.closest('[data-admin-html-block="html"]');
  return block && root?.contains(block) ? (block as HTMLElement) : null;
};

const createHtmlBlock = (html: string) =>
  `<div data-admin-html-block="html" data-admin-block-id="bloc-${Date.now()}" data-admin-block-label="Bloc HTML / widget">${html}</div><p><br></p>`;

const getBlockHtml = (block: RichContentBlock) => {
  for (const key of ['html', 'content', 'value', 'markup', 'rawHtml', 'body'] as const) {
    const value = block[key];
    if (typeof value === 'string') return value;
  }
  return '';
};

const escapeHtmlAttributeValue = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const blockToEditableHtml = (block: RichContentBlock, index: number) => {
  const rawHtml = getBlockHtml(block);
  if (block.type === 'html') {
    const id = typeof block.id === 'string' && block.id.trim() ? block.id : `bloc-${index}`;
    const label = typeof block.label === 'string' && block.label.trim() ? block.label : 'Bloc HTML / widget';
    return `<div data-admin-content-block-index="${index}" data-admin-html-block="html" data-admin-block-id="${escapeHtmlAttributeValue(id)}" data-admin-block-label="${escapeHtmlAttributeValue(label)}">${rawHtml}</div>`;
  }
  return `<div data-admin-content-block-index="${index}">${rawHtml}</div>`;
};

const valueToEditableHtml = (value: RichContentValue) =>
  Array.isArray(value.blocks) && value.blocks.length > 0 ? value.blocks.map(blockToEditableHtml).join('') : value.html;

const serializeEditorValue = (root: HTMLElement | null, previousValue: RichContentValue): RichContentValue => {
  const html = root?.innerHTML ?? '';
  if (!Array.isArray(previousValue.blocks) || previousValue.blocks.length === 0 || !root) return { ...previousValue, html };

  const blocks = previousValue.blocks.map((block, index) => {
    const element = root.querySelector<HTMLElement>(`[data-admin-content-block-index="${index}"]`);
    if (!element) return block;
    const nextHtml = element.innerHTML;
    if (block.type === 'html') return { ...block, html: nextHtml };
    if (typeof block.html === 'string') return { ...block, html: nextHtml };
    if (typeof block.content === 'string') return { ...block, content: nextHtml };
    if (typeof block.value === 'string') return { ...block, value: nextHtml };
    if (typeof block.markup === 'string') return { ...block, markup: nextHtml };
    if (typeof block.rawHtml === 'string') return { ...block, rawHtml: nextHtml };
    if (typeof block.body === 'string') return { ...block, body: nextHtml };
    return { ...block, html: nextHtml };
  });

  return { ...previousValue, html, blocks };
};

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
  const [htmlBlockValue, setHtmlBlockValue] = useState('');
  const [editingHtmlBlockId, setEditingHtmlBlockId] = useState<string | null>(null);
  const [htmlBlockError, setHtmlBlockError] = useState('');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyFormats);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [resizeHint, setResizeHint] = useState('');

  useEffect(() => {
    const nextHtml = valueToEditableHtml(value);
    if (ref.current && ref.current.innerHTML !== nextHtml) ref.current.innerHTML = nextHtml;
  }, [value]);

  const emit = useCallback(() => onChange(serializeEditorValue(ref.current, value)), [onChange, value]);

  const selectImage = useCallback((image: HTMLImageElement | null) => {
    setSelectedImage(image && ref.current?.contains(image) ? image : null);
  }, []);

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
      selectImage(null);
      return;
    }

    selectImage(getSelectedImage());

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
  }, [selectImage]);

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
      `<figure><img src="${safeUrl}" alt="${safeAlt}" style="width: 100%; height: auto;" /><figcaption>${safeAlt}</figcaption></figure><p><br></p>`
    );
  };

  const editSelectedImageLink = () => {
    saveSelection();
    const image = getSelectedImage();
    if (!image || !ref.current?.contains(image)) {
      setUploadError('Cliquez d’abord sur une image dans le contenu pour lui associer un lien.');
      return;
    }

    const currentLink = image.closest('a');
    const currentUrl = currentLink?.getAttribute('href') ?? '';
    const nextUrl = window.prompt('URL du lien de l’image (laissez vide pour retirer le lien)', currentUrl);
    if (nextUrl === null) return;

    const trimmedUrl = nextUrl.trim();
    if (!trimmedUrl) {
      if (currentLink) currentLink.replaceWith(image);
      setUploadError('');
      emit();
      saveSelection();
      refreshActiveFormats();
      return;
    }

    if (currentLink) {
      currentLink.setAttribute('href', trimmedUrl);
      currentLink.setAttribute('target', '_blank');
      currentLink.setAttribute('rel', 'noopener noreferrer');
    } else {
      const link = document.createElement('a');
      link.setAttribute('href', trimmedUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      image.replaceWith(link);
      link.appendChild(image);
    }

    setUploadError('');
    emit();
    saveSelection();
    refreshActiveFormats();
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

  const openAddHtmlBlock = () => {
    saveSelection();
    setEditingHtmlBlockId(null);
    setHtmlBlockValue(' ');
    setHtmlBlockError('');
  };

  const openEditHtmlBlock = () => {
    saveSelection();
    const block = getSelectedHtmlBlock(ref.current);
    if (!block) {
      setHtmlBlockError('Cliquez d’abord dans un bloc HTML / widget à modifier.');
      setEditingHtmlBlockId(null);
      setHtmlBlockValue('');
      return;
    }
    setEditingHtmlBlockId(block.dataset.adminBlockId || 'selected');
    setHtmlBlockValue(block.innerHTML.trim());
    setHtmlBlockError('');
  };

  const saveHtmlBlock = () => {
    const sanitizedHtml = sanitizeCustomHtmlBlock(htmlBlockValue);
    if (!sanitizedHtml) {
      setHtmlBlockError('Le bloc HTML est vide après nettoyage.');
      return;
    }

    if (editingHtmlBlockId) {
      const block = getSelectedHtmlBlock(ref.current) || ref.current?.querySelector<HTMLElement>(`[data-admin-block-id="${CSS.escape(editingHtmlBlockId)}"]`);
      if (!block) {
        setHtmlBlockError('Bloc HTML introuvable dans le contenu.');
        return;
      }
      block.innerHTML = sanitizedHtml;
      emit();
      saveSelection();
    } else {
      restoreSelection();
      document.execCommand('insertHTML', false, createHtmlBlock(sanitizedHtml));
      const newBlock = ref.current?.querySelector<HTMLElement>('[data-admin-block-id^="bloc-"]:not([data-admin-content-block-index])');
      if (newBlock && Array.isArray(value.blocks)) {
        const nextIndex = value.blocks.length;
        newBlock.dataset.adminContentBlockIndex = String(nextIndex);
        onChange({
          ...serializeEditorValue(ref.current, value),
          blocks: [
            ...value.blocks,
            {
              id: newBlock.dataset.adminBlockId,
              type: 'html',
              html: sanitizedHtml,
              label: newBlock.dataset.adminBlockLabel || 'Bloc HTML / widget'
            }
          ]
        });
        saveSelection();
        setHtmlBlockValue('');
        setEditingHtmlBlockId(null);
        setHtmlBlockError('');
        refreshActiveFormats();
        return;
      }
      emit();
      saveSelection();
    }

    setHtmlBlockValue('');
    setEditingHtmlBlockId(null);
    setHtmlBlockError('');
    refreshActiveFormats();
  };

  const cancelHtmlBlock = () => {
    setHtmlBlockValue('');
    setEditingHtmlBlockId(null);
    setHtmlBlockError('');
  };

  const deleteSelectedHtmlBlock = () => {
    const block = getSelectedHtmlBlock(ref.current);
    if (!block) {
      setHtmlBlockError('Cliquez d’abord dans un bloc HTML / widget à supprimer.');
      return;
    }
    block.remove();
    setHtmlBlockError('');
    emit();
  };

  const moveSelectedHtmlBlock = (direction: 'up' | 'down') => {
    const block = getSelectedHtmlBlock(ref.current);
    if (!block) {
      setHtmlBlockError('Cliquez d’abord dans un bloc HTML / widget à déplacer.');
      return;
    }
    const sibling = direction === 'up' ? block.previousElementSibling : block.nextElementSibling;
    if (!sibling || !block.parentElement) return;
    if (direction === 'up') block.parentElement.insertBefore(block, sibling);
    else block.parentElement.insertBefore(sibling, block);
    setHtmlBlockError('');
    emit();
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
      const optimizedFile = await resizeImageFile(file);
      if (optimizedFile.size < file.size) {
        setResizeHint(`Image optimisée avant upload : ${formatBytes(file.size)} → ${formatBytes(optimizedFile.size)}.`);
      } else {
        setResizeHint('');
      }
      const uploaded = await onUploadImage(optimizedFile);
      insertImage(uploaded.url, alt || uploaded.alt || file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload image impossible.');
    } finally {
      setUploading(false);
    }
  };

  const resizeImageFromPointer = (image: HTMLImageElement, startX: number) => {
    const startWidth = image.getBoundingClientRect().width;
    const { width: naturalWidth, height: naturalHeight } = getImageNaturalSize(image);
    const aspectRatio = naturalWidth && naturalHeight ? naturalHeight / naturalWidth : image.getBoundingClientRect().height / startWidth || 1;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const editorWidth = ref.current?.clientWidth ?? startWidth;
      const nextWidth = Math.max(80, Math.min(editorWidth, startWidth + moveEvent.clientX - startX));
      const nextHeight = Math.round(nextWidth * aspectRatio);
      image.style.width = `${Math.round(nextWidth)}px`;
      image.style.height = 'auto';
      image.setAttribute('width', String(Math.round(nextWidth)));
      image.setAttribute('height', String(nextHeight));
      setResizeHint(`Affichage image : ${Math.round(nextWidth)} × ${nextHeight} px. Le fichier uploadé est optimisé automatiquement.`);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      emit();
      saveSelection();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startSelectedImageResize = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedImage) return;
    resizeImageFromPointer(selectedImage, event.clientX);
  };

  const startImageCornerResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;

    const rect = target.getBoundingClientRect();
    const isBottomRightCorner = event.clientX >= rect.right - 24 && event.clientY >= rect.bottom - 24;
    if (!isBottomRightCorner) return;

    event.preventDefault();
    event.stopPropagation();
    selectImage(target);
    resizeImageFromPointer(target, event.clientX);
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
        <button type="button" className={buttonClass(Boolean(selectedImage?.closest('a')))} onClick={editSelectedImageLink}>Lien image</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass()} onClick={openAddHtmlBlock}>Ajouter un bloc HTML</button>
        <button type="button" className={buttonClass()} onClick={openEditHtmlBlock}>Modifier bloc HTML</button>
        <button type="button" className={buttonClass()} onClick={deleteSelectedHtmlBlock}>Supprimer bloc HTML</button>
        <button type="button" className={buttonClass()} onClick={() => moveSelectedHtmlBlock('up')}>Monter bloc</button>
        <button type="button" className={buttonClass()} onClick={() => moveSelectedHtmlBlock('down')}>Descendre bloc</button>
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

      {editingHtmlBlockId !== null || htmlBlockValue || htmlBlockError ? (
        <div className="border-b border-slate-700 bg-slate-900 p-4">
          <label className="block text-sm font-semibold text-slate-100" htmlFor="html-block-editor">
            {editingHtmlBlockId ? 'Modifier le bloc HTML / widget' : 'Nouveau bloc HTML / widget'}
          </label>
          <p className="mt-1 text-xs text-slate-400">Collez uniquement le markup du widget. Les balises &lt;script&gt;, attributs on* et URLs javascript: sont retirés avant insertion dans l’éditeur.</p>
          <textarea
            id="html-block-editor"
            className="mt-3 min-h-40 w-full rounded border border-slate-600 bg-white p-3 font-mono text-xs text-slate-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            value={htmlBlockValue}
            onChange={(e) => setHtmlBlockValue(e.target.value)}
            placeholder={'<div data-gyg-widget="..."></div>'}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={buttonClass()} onClick={saveHtmlBlock}>{editingHtmlBlockId ? 'Mettre à jour le bloc' : 'Insérer le bloc à la position du curseur'}</button>
            <button type="button" className={buttonClass()} onClick={cancelHtmlBlock}>Annuler</button>
          </div>
          {htmlBlockError ? <p className="mt-2 text-xs text-red-300">{htmlBlockError}</p> : null}
        </div>
      ) : null}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[520px] w-full bg-white p-8 text-base leading-8 text-slate-900 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500 [&_figure]:my-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_[data-admin-html-block='html']]:my-6 [&_[data-admin-html-block='html']]:rounded-xl [&_[data-admin-html-block='html']]:border [&_[data-admin-html-block='html']]:border-dashed [&_[data-admin-html-block='html']]:border-amber-400 [&_[data-admin-html-block='html']]:bg-amber-50 [&_[data-admin-html-block='html']]:p-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:cursor-se-resize [&_img]:rounded-xl [&_img]:outline-offset-4 [&_img]:focus:outline [&_img]:focus:outline-2 [&_img]:focus:outline-brand-500 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6"
        onBlur={saveSelection}
        onMouseDown={startImageCornerResize}
        onInput={() => {
          emit();
          saveSelection();
          refreshActiveFormats();
        }}
        onKeyUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        onMouseUp={(event) => {
          const target = event.target;
          selectImage(target instanceof HTMLImageElement ? target : null);
          saveSelection();
          refreshActiveFormats();
        }}
      />
      {selectedImage ? (
        <div className="border-t border-brand-900 bg-brand-950/80 px-3 py-2 text-xs text-brand-50">
          Image sélectionnée : faites glisser son coin inférieur droit, utilisez la poignée ci-dessous pour modifier sa taille, ou le bouton « Lien image » pour la rendre cliquable dans l’article.
          <button
            type="button"
            className="ml-3 cursor-se-resize rounded border border-brand-300 bg-brand-600 px-2 py-1 font-semibold text-white"
            onMouseDown={startSelectedImageResize}
          >
            ↘ Redimensionner
          </button>
        </div>
      ) : null}
      {resizeHint ? <p className="border-t border-emerald-900 bg-emerald-950/70 px-3 py-2 text-xs text-emerald-100">{resizeHint}</p> : null}
      {uploadError ? <p className="border-t border-red-900 bg-red-950/70 px-3 py-2 text-xs text-red-100">{uploadError}</p> : null}
      <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
        <span>{uploading ? 'Upload image en cours…' : `${contentHtml.length} caractères HTML`}</span>
        <span>Format courant : {activeFormats.block.toUpperCase()}{activeFormats.link ? ' · lien' : ''}</span>
      </div>
    </div>
  );
}
