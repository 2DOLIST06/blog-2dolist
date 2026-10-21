export type RichContentBlock = Record<string, unknown> & {
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

const htmlKeys = ['html', 'content', 'value', 'markup', 'rawHtml', 'body'] as const;

export function cleanEditorClone(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-admin-drag-handle]').forEach((handle) => handle.remove());
  return clone;
}

export function decorateHtmlBlocks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-admin-html-block="html"]').forEach((block) => {
    if (block.querySelector(':scope > [data-admin-drag-handle]')) return;
    const handle = document.createElement('span');
    handle.dataset.adminDragHandle = '';
    handle.contentEditable = 'false';
    handle.draggable = true;
    handle.textContent = '⠿ Déplacer le bloc HTML';
    handle.title = 'Faites glisser cette poignée à l’endroit voulu dans le texte';
    handle.className = 'mb-3 block cursor-grab select-none rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900';
    block.prepend(handle);
  });
}

/** Read DOM order, including inserted, split, moved and deleted blocks. */
export function serializeEditorBlocks(root: HTMLElement, previous: RichContentBlock[]) {
  const clone = cleanEditorClone(root);
  const blocks: RichContentBlock[] = [];
  const seenIds = new Set<string>();
  Array.from(clone.childNodes).forEach((node, position) => {
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : null;
    const originalIndex = element?.getAttribute('data-admin-content-block-index');
    const original = originalIndex !== null && originalIndex !== undefined ? previous[Number(originalIndex)] : undefined;
    const isHtmlBlock = element?.matches('[data-admin-html-block="html"]');
    const textContainer = document.createElement('div');
    if (!element) textContainer.append(node.cloneNode(true));
    const html = original || isHtmlBlock ? element!.innerHTML : element?.outerHTML ?? textContainer.innerHTML;
    const key = original?.type === 'html' ? 'html' : htmlKeys.find((key) => typeof original?.[key] === 'string') ?? 'html';
    const block: RichContentBlock = {
      ...(original ?? { type: isHtmlBlock ? 'html' : 'richText' }),
      [key]: html
    };
    if (isHtmlBlock) {
      block.type = 'html';
      block.id = element!.dataset.adminBlockId;
      block.label = element!.dataset.adminBlockLabel || 'Bloc HTML / widget';
    }
    // Splitting a paragraph also splits its imported block wrapper.
    if (block.id && seenIds.has(block.id)) block.id = crypto.randomUUID();
    if (block.id) seenIds.add(block.id);
    if (original || isHtmlBlock) {
      const live = root.childNodes[position] as HTMLElement;
      live.dataset.adminContentBlockIndex = String(blocks.length);
      element!.dataset.adminContentBlockIndex = String(blocks.length);
      if (isHtmlBlock && block.id) {
        live.dataset.adminBlockId = block.id;
        element!.dataset.adminBlockId = block.id;
      }
    }
    blocks.push(block);
  });
  return { html: clone.innerHTML, blocks };
}

/** Split all enclosing text containers so the new block is a root sibling. */
export function insertBlockAtRange(root: HTMLElement, range: Range, block: HTMLElement) {
  if (!root.contains(range.commonAncestorContainer) || block.contains(range.startContainer)) return false;
  const caret = range.cloneRange();
  caret.collapse(true);
  // Remove a moved block first; the live range adjusts to the removal.
  block.remove();
  // At a container boundary, insert beside it instead of leaving an empty
  // paragraph (or an empty imported wrapper) behind after every drag.
  while (caret.startContainer !== root) {
    const container = caret.startContainer;
    const length = container.nodeType === Node.TEXT_NODE ? container.textContent!.length : container.childNodes.length;
    if (caret.startOffset === 0) caret.setStartBefore(container);
    else if (caret.startOffset === length) caret.setStartAfter(container);
    else break;
    caret.collapse(true);
  }
  const tailRange = caret.cloneRange();
  tailRange.setEnd(root, root.childNodes.length);
  const tail = tailRange.extractContents();
  root.append(block, tail);
  if (!block.nextSibling) {
    const paragraph = document.createElement('p');
    paragraph.append(document.createElement('br'));
    root.append(paragraph);
  }
  const selection = document.getSelection();
  const after = document.createRange();
  after.setStartAfter(block);
  after.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(after);
  return true;
}

export function rangeAtPoint(root: HTMLElement, x: number, y: number): Range | null {
  const doc = root.ownerDocument as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  let range = doc.caretRangeFromPoint?.(x, y) ?? null;
  if (!range) {
    const position = doc.caretPositionFromPoint?.(x, y);
    if (position) {
      range = doc.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
    }
  }
  return range && root.contains(range.commonAncestorContainer) ? range : null;
}
