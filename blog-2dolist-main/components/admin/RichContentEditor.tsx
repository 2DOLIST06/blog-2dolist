'use client';

import { type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cleanEditorClone, decorateHtmlBlocks, insertBlockAtRange, rangeAtPoint, serializeEditorBlocks, type RichContentBlock } from '@/lib/admin/editor-blocks';
import { InternalLinkPicker } from '@/components/admin/InternalLinkPicker';
import { collectLinkOccurrences, groupLinkOccurrences, linkGroupKey, type LinkGroup } from '@/lib/admin/internal-links';
import type { InternalLinkCategoryOption, InternalLinkDestination } from '@/types/internal-links';

export interface RichContentValue {
  type: 'doc';
  html: string;
  blocks?: RichContentBlock[];
  [key: string]: unknown;
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
  `<div data-admin-html-block="html" data-admin-block-id="bloc-${crypto.randomUUID()}" data-admin-block-label="Bloc HTML / widget">${html}</div>`;

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
  if (!root) return previousValue;
  if (!Array.isArray(previousValue.blocks) || previousValue.blocks.length === 0) {
    return { ...previousValue, html: cleanEditorClone(root).innerHTML };
  }
  return { ...previousValue, ...serializeEditorBlocks(root, previousValue.blocks) };
};

export function RichContentEditor({
  value,
  onChange,
  onUploadImage,
  internalLinkCategories = []
}: {
  value: RichContentValue;
  onChange: (value: RichContentValue) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
  internalLinkCategories?: InternalLinkCategoryOption[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const htmlInsertionRange = useRef<Range | null>(null);
  const emittedHtml = useRef<string | null>(null);
  const draggedHtmlBlock = useRef<HTMLElement | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [htmlBlockValue, setHtmlBlockValue] = useState('');
  const [editingHtmlBlockId, setEditingHtmlBlockId] = useState<string | null>(null);
  const [htmlBlockError, setHtmlBlockError] = useState('');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyFormats);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const [resizeHint, setResizeHint] = useState('');
  const [internalPickerOpen, setInternalPickerOpen] = useState(false);
  const [internalLinkError, setInternalLinkError] = useState('');
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [groupPositions, setGroupPositions] = useState<Record<string, number>>({});
  const summaryFrame = useRef<number | null>(null);
  const linkTarget = useRef<{ anchor: HTMLAnchorElement | null; image: HTMLImageElement | null } | null>(null);
  const [linkOptions, setLinkOptions] = useState<{ url: string; rel: string[]; newTab: boolean } | null>(null);
  const [linkError, setLinkError] = useState('');

  const refreshLinkSummary = useCallback(() => {
    if (summaryFrame.current !== null) cancelAnimationFrame(summaryFrame.current);
    summaryFrame.current = requestAnimationFrame(() => {
      if (ref.current) setLinkGroups(groupLinkOccurrences(collectLinkOccurrences(ref.current)));
      summaryFrame.current = null;
    });
  }, []);

  useEffect(() => {
    // Imported HTML is inert while parsed in a template; remove executable content
    // before it ever reaches the contenteditable DOM. data-* widget attributes remain.
    const nextHtml = sanitizeCustomHtmlBlock(valueToEditableHtml(value));
    if (ref.current) {
      // A local edit already has the right DOM and live selection. Rebuilding it
      // from blocks here would invalidate the saved caret and split containers.
      const currentHtml = cleanEditorClone(ref.current).innerHTML;
      if (currentHtml !== nextHtml && !(emittedHtml.current === value.html && currentHtml === value.html)) {
        ref.current.innerHTML = nextHtml;
        savedSelection.current = null;
        htmlInsertionRange.current = null;
      }
      decorateHtmlBlocks(ref.current);
    }
    refreshLinkSummary();
  }, [value, refreshLinkSummary]);

  useEffect(() => () => { if (summaryFrame.current !== null) cancelAnimationFrame(summaryFrame.current); }, []);

  const emit = useCallback(() => {
    const nextValue = serializeEditorValue(ref.current, value);
    emittedHtml.current = nextValue.html;
    onChange(nextValue);
  }, [onChange, value]);

  const selectImage = useCallback((image: HTMLImageElement | null) => {
    const nextImage = image && ref.current?.contains(image) ? image : null;
    selectedImageRef.current = nextImage;
    setSelectedImage(nextImage);
  }, []);

  const getCurrentSelectedImage = useCallback(() => {
    const selectionImage = getSelectedImage();
    if (selectionImage && ref.current?.contains(selectionImage)) return selectionImage;
    const storedImage = selectedImageRef.current;
    if (storedImage && ref.current?.contains(storedImage)) return storedImage;
    return null;
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
      setHasTextSelection(false);
      setActiveFormats((current) => ({ ...current, block: current.block || 'p' }));
      selectImage(null);
      return;
    }

    setHasTextSelection(Boolean(selection && !selection.isCollapsed && selection.toString().length > 0));

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
    const updateSelection = () => { saveSelection(); refreshActiveFormats(); };
    document.addEventListener('selectionchange', updateSelection);
    return () => document.removeEventListener('selectionchange', updateSelection);
  }, [refreshActiveFormats, saveSelection]);

  const exec = (cmd: string, valueArg?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, valueArg);
    saveSelection();
    emit();
    refreshActiveFormats();
    refreshLinkSummary();
  };

  const openInternalLinkPicker = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !selection.toString()) return;
    const range = selection.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    savedSelection.current = range.cloneRange();
    setInternalLinkError('');
    setInternalPickerOpen(true);
  };

  const applyInternalLink = (destination: InternalLinkDestination) => {
    const range = savedSelection.current;
    const root = ref.current;
    if (!range || !root || range.collapsed || !range.startContainer.isConnected || !range.endContainer.isConnected || !root.contains(range.commonAncestorContainer)) {
      setInternalLinkError('La sélection n’est plus disponible. Sélectionnez à nouveau le texte à lier.');
      setInternalPickerOpen(false);
      return;
    }
    try {
      root.focus({ preventScroll: true });
      const selection = document.getSelection();
      if (!selection) throw new Error('selection');
      selection.removeAllRanges(); selection.addRange(range);
      const start = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement;
      const end = range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer as Element : range.endContainer.parentElement;
      const startLink = start?.closest('a');
      const endLink = end?.closest('a');
      if (startLink && startLink === endLink && root.contains(startLink)) {
        document.execCommand('createLink', false, destination.href);
        startLink.removeAttribute('target'); startLink.removeAttribute('rel');
      } else {
        document.execCommand('unlink', false);
        document.execCommand('createLink', false, destination.href);
      }
      saveSelection(); emit(); refreshActiveFormats(); refreshLinkSummary(); setInternalPickerOpen(false); setInternalLinkError('');
    } catch {
      setInternalLinkError('Impossible de restaurer la sélection. Sélectionnez à nouveau le texte à lier.');
      setInternalPickerOpen(false);
    }
  };

  const goToLink = (group: LinkGroup, requestedPosition?: number) => {
    const root = ref.current;
    if (!root) return;
    const occurrences = collectLinkOccurrences(root);
    const matching = occurrences.filter((item) => linkGroupKey(item.anchor, item.href) === group.key);
    if (!matching.length) { refreshLinkSummary(); return; }
    const current = requestedPosition ?? groupPositions[group.key] ?? 0;
    const position = (current + matching.length) % matching.length;
    const anchor = root.querySelectorAll<HTMLAnchorElement>('a[href]')[matching[position].documentIndex];
    if (!anchor) return;
    const range = document.createRange(); range.selectNodeContents(anchor);
    const selection = document.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    root.focus({ preventScroll: true }); anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    anchor.animate([{ outline: '3px solid #f59e0b', backgroundColor: '#fef3c7' }, { outline: '3px solid transparent', backgroundColor: 'transparent' }], { duration: 1800 });
    setGroupPositions((state) => ({ ...state, [group.key]: position }));
  };

  const openLinkOptions = (image: HTMLImageElement | null = null) => {
    saveSelection();
    const candidate = image?.closest('a') ?? getSelectionElement()?.closest('a');
    const anchor = candidate && ref.current?.contains(candidate) ? candidate as HTMLAnchorElement : null;
    linkTarget.current = { anchor, image };
    setLinkError('');
    setLinkOptions({
      url: anchor?.getAttribute('href') ?? '',
      rel: (anchor?.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean),
      newTab: anchor ? anchor.target === '_blank' : Boolean(image)
    });
  };

  const addLink = () => openLinkOptions(getCurrentSelectedImage());
  const editSelectedLink = () => openLinkOptions(getCurrentSelectedImage());

  const applyLinkOptions = (remove = false) => {
    const root = ref.current;
    const target = linkTarget.current;
    if (!root || !target || !linkOptions) return;
    if ((target.anchor && !root.contains(target.anchor)) || (target.image && !root.contains(target.image))) {
      setLinkError('La sélection a changé. Fermez ce panneau et sélectionnez à nouveau le lien.');
      return;
    }
    const url = linkOptions.url.trim();
    if (!remove && (!url || !/^(https?:|mailto:|tel:|\/|#|\?|\.\.?\/)/i.test(url) || url.startsWith('//'))) {
      setLinkError('Saisissez une URL https://, http://, mailto:, tel: ou un chemin relatif (/…).');
      return;
    }
    if (!target.anchor && !target.image && (!savedSelection.current || !root.contains(savedSelection.current.commonAncestorContainer))) {
      setLinkError('Sélectionnez à nouveau le texte à lier.');
      return;
    }
    restoreSelection();
    if (remove) {
      if (target.anchor) target.anchor.replaceWith(...Array.from(target.anchor.childNodes));
    } else {
      let anchors: HTMLAnchorElement[] = [];
      if (target.anchor) anchors = [target.anchor];
      else if (target.image) {
        const anchor = document.createElement('a');
        target.image.replaceWith(anchor);
        anchor.appendChild(target.image);
        anchors = [anchor];
      } else {
        // A unique temporary href identifies every anchor created across formatted text.
        const marker = `https://editor.invalid/${crypto.randomUUID()}`;
        if (document.getSelection()?.toString()) document.execCommand('createLink', false, marker);
        else document.execCommand('insertHTML', false, `<a href="${marker}">${escapeHtmlAttribute(url)}</a>`);
        anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('a')).filter((anchor) => anchor.getAttribute('href') === marker);
      }
      if (!anchors.length) {
        setLinkError('Impossible de créer le lien. Sélectionnez à nouveau le texte.');
        return;
      }
      const rel = new Set(linkOptions.rel);
      if (linkOptions.newTab) rel.add('noopener');
      for (const anchor of anchors) {
        anchor.setAttribute('href', url);
        if (linkOptions.newTab) anchor.setAttribute('target', '_blank');
        else anchor.removeAttribute('target');
        if (rel.size) anchor.setAttribute('rel', Array.from(rel).join(' '));
        else anchor.removeAttribute('rel');
      }
    }
    setLinkOptions(null);
    linkTarget.current = null;
    saveSelection(); emit(); refreshActiveFormats(); refreshLinkSummary();
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
    const image = getCurrentSelectedImage();
    if (!image) {
      setUploadError('Sélectionnez une image dans le contenu, puis cliquez sur « Lien image ».');
      return;
    }

    setUploadError('');
    openLinkOptions(image);
  };

  const handleToolbarMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement) event.preventDefault();
  };

  const editSelectedImageAlt = () => {
    saveSelection();
    const image = getCurrentSelectedImage();
    if (!image) {
      setUploadError('Sélectionnez une image dans le contenu, puis cliquez sur « Alt image ».');
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
    htmlInsertionRange.current = savedSelection.current?.cloneRange() ?? null;
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
    setHtmlBlockValue(cleanEditorClone(block).innerHTML.trim());
    setHtmlBlockError('');
  };

  const saveHtmlBlock = () => {
    const sanitizedHtml = sanitizeCustomHtmlBlock(htmlBlockValue);
    if (!sanitizedHtml) {
      setHtmlBlockError('Le bloc HTML est vide après nettoyage.');
      return;
    }

    if (editingHtmlBlockId) {
      const block = ref.current?.querySelector<HTMLElement>(`[data-admin-block-id="${CSS.escape(editingHtmlBlockId)}"]`);
      if (!block) {
        setHtmlBlockError('Bloc HTML introuvable dans le contenu.');
        return;
      }
      block.innerHTML = sanitizedHtml;
      ref.current?.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(block);
      range.collapse(true);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      saveSelection();
      emit();
    } else {
      const root = ref.current;
      if (!root) return;
      const range = htmlInsertionRange.current;
      if (!range || !root.contains(range.commonAncestorContainer)) {
        setHtmlBlockError('Placez le curseur dans le contenu, puis cliquez sur « Ajouter un bloc HTML ».');
        return;
      }
      const template = document.createElement('template');
      template.innerHTML = createHtmlBlock(sanitizedHtml);
      const block = template.content.firstElementChild as HTMLElement;
      root.focus({ preventScroll: true });
      insertBlockAtRange(root, range, block);
      htmlInsertionRange.current = null;
      saveSelection();
      emit();
    }

    setHtmlBlockValue('');
    setEditingHtmlBlockId(null);
    setHtmlBlockError('');
    refreshActiveFormats();
  };

  const cancelHtmlBlock = () => {
    htmlInsertionRange.current = null;
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

  const startBlockDrag = (event: ReactDragEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const handle = target.closest('[data-admin-drag-handle]');
    const block = handle?.closest<HTMLElement>('[data-admin-html-block="html"]');
    if (!block || !ref.current?.contains(block)) return;
    draggedHtmlBlock.current = block;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'Bloc HTML');
  };

  const dropHtmlBlock = (event: ReactDragEvent<HTMLDivElement>) => {
    const block = draggedHtmlBlock.current;
    const root = ref.current;
    if (!block || !root) return;
    event.preventDefault();
    draggedHtmlBlock.current = null;
    const range = rangeAtPoint(root, event.clientX, event.clientY);
    if (!range || (event.target instanceof Node && block.contains(event.target))) return;
    if (!insertBlockAtRange(root, range, block)) return;
    saveSelection();
    emit();
    refreshLinkSummary();
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
      <div
        className="sticky z-30 flex flex-wrap items-center gap-2 rounded-t-xl border-b border-slate-700 bg-slate-900/95 p-3 shadow-lg shadow-slate-950/20 backdrop-blur"
        style={{ top: 'var(--admin-sticky-top, 0px)' }}
        onMouseDown={handleToolbarMouseDown}
      >
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
        <button type="button" className={buttonClass(activeFormats.link)} disabled={!activeFormats.link} onClick={editSelectedLink}>Modifier le lien</button>
        <button type="button" className={buttonClass()} disabled={!hasTextSelection} onClick={openInternalLinkPicker}>Lien interne</button>
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

      {linkOptions ? (
        <div role="region" aria-label="Options du lien" className="border-b border-slate-700 bg-slate-900 p-4 text-sm text-slate-100">
          <label className="block font-semibold">URL du lien
            <input autoFocus type="text" value={linkOptions.url} onChange={(event) => setLinkOptions({ ...linkOptions, url: event.target.value })} className="mt-2 w-full rounded border border-slate-600 bg-white p-2 text-slate-950" placeholder="https://… ou /articles/…" />
          </label>
          <p className="mt-3 text-xs text-slate-400">Sans sponsored, nofollow ou ugc, le lien est classique (dofollow). Ces options peuvent se combiner.</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {(['sponsored', 'nofollow', 'ugc', 'noreferrer'] as const).map((token) => (
              <label key={token} className="flex items-center gap-2">
                <input type="checkbox" checked={linkOptions.rel.includes(token)} onChange={(event) => setLinkOptions({ ...linkOptions, rel: event.target.checked ? [...linkOptions.rel, token] : linkOptions.rel.filter((value) => value !== token) })} />
                {{ sponsored: 'Sponsored (publicité / affiliation)', nofollow: 'Nofollow', ugc: 'UGC (contenu utilisateur)', noreferrer: 'Noreferrer (masquer la provenance)' }[token]}
              </label>
            ))}
            <label className="flex items-center gap-2"><input type="checkbox" checked={linkOptions.newTab} onChange={(event) => setLinkOptions({ ...linkOptions, newTab: event.target.checked })} />Ouvrir dans un nouvel onglet</label>
          </div>
          {linkError ? <p role="alert" className="mt-2 text-red-300">{linkError}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" className={buttonClass()} onClick={() => applyLinkOptions()}>Appliquer le lien</button>
            {linkTarget.current?.anchor ? <button type="button" className={buttonClass()} onClick={() => applyLinkOptions(true)}>Retirer le lien</button> : null}
            <button type="button" className={buttonClass()} onClick={() => { setLinkOptions(null); linkTarget.current = null; restoreSelection(); }}>Annuler</button>
          </div>
        </div>
      ) : null}

      {internalPickerOpen ? <InternalLinkPicker categories={internalLinkCategories} onClose={() => setInternalPickerOpen(false)} onSelect={applyInternalLink} /> : null}
      {internalLinkError ? <p className="border-b border-red-900 bg-red-950/70 px-3 py-2 text-xs text-red-100">{internalLinkError}</p> : null}

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
        className="min-h-[520px] w-full bg-white p-8 text-base leading-8 text-slate-900 outline-none [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500 [&_figure]:my-8 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_hr]:my-8 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_pre]:my-5 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_[data-admin-html-block='html']]:my-6 [&_[data-admin-html-block='html']]:rounded-xl [&_[data-admin-html-block='html']]:border [&_[data-admin-html-block='html']]:border-dashed [&_[data-admin-html-block='html']]:border-amber-400 [&_[data-admin-html-block='html']]:bg-amber-50 [&_[data-admin-html-block='html']]:p-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:cursor-se-resize [&_img]:rounded-xl [&_img]:outline-offset-4 [&_img]:focus:outline [&_img]:focus:outline-2 [&_img]:focus:outline-brand-500"
        onDragStart={startBlockDrag}
        onDragEnd={() => { draggedHtmlBlock.current = null; }}
        onDragOver={(event) => {
          if (!draggedHtmlBlock.current) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDrop={dropHtmlBlock}
        onBlur={saveSelection}
        onMouseDown={startImageCornerResize}
        onInput={() => {
          emit();
          saveSelection();
          refreshActiveFormats();
          refreshLinkSummary();
        }}
        onKeyUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        onMouseUp={(event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.closest('[data-admin-drag-handle]')) {
            const block = target.closest('[data-admin-html-block="html"]');
            if (block) {
              const range = document.createRange();
              range.setStart(block, 1);
              range.collapse(true);
              const selection = document.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
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
      <section className="border-t border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
        <h3 className="font-semibold text-white">Liens de l’article</h3>
        <p className="mt-1 text-xs text-slate-400">{linkGroups.reduce((total, group) => total + group.occurrenceIndexes.length, 0)} liens • {linkGroups.length} ancres/liens distincts • {new Set(linkGroups.map((group) => group.href)).size} destinations</p>
        {linkGroups.length ? <ul className="mt-3 space-y-2">{linkGroups.map((group) => {
          const count = group.occurrenceIndexes.length;
          const position = Math.min(groupPositions[group.key] ?? 0, count - 1);
          return <li key={group.key} className="rounded border border-slate-700 bg-slate-950 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-white">{group.anchor}</strong>{count > 1 ? <span className="ml-2 rounded bg-brand-800 px-1.5 py-0.5 text-xs">×{count}</span> : null}<p className="break-all text-xs text-slate-400">{group.href}</p></div><span className="rounded bg-slate-800 px-2 py-1 text-xs">{group.kind}</span></div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {count > 1 ? <><button type="button" className={buttonClass()} onClick={() => goToLink(group, position - 1)}>Précédent</button><span className="text-xs">{position + 1}/{count}</span><button type="button" className={buttonClass()} onClick={() => goToLink(group, position + 1)}>Suivant</button></> : null}
              <button type="button" className={buttonClass()} onClick={() => goToLink(group, position)}>Aller au lien</button>
              <button type="button" className={buttonClass()} onClick={() => { try { window.open(new URL(group.href, window.location.origin).href, '_blank', 'noopener,noreferrer'); } catch { /* URL non ouvrable */ } }}>Ouvrir la page</button>
            </div>
          </li>;
        })}</ul> : <p className="mt-3 text-slate-400">Aucun lien dans le contenu.</p>}
      </section>
      <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
        <span>{uploading ? 'Upload image en cours…' : `${contentHtml.length} caractères HTML`}</span>
        <span>Format courant : {activeFormats.block.toUpperCase()}{activeFormats.link ? ' · lien' : ''}</span>
      </div>
    </div>
  );
}
