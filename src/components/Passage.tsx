import { useRef } from 'react';

export interface Mark {
  id: string;
  start: number;
  end: number;
  kind: 'hl' | 'note' | 'locate';
  note?: string;
}

interface Props {
  text: string;
  marks: Mark[];
  onSelect?: (start: number, end: number, rect: DOMRect) => void;
  onMarkClick?: (m: Mark, rect: DOMRect) => void;
}

/** Splits text into paragraphs and renders highlight / note / locate marks by character offset. */
export default function Passage({ text, marks, onSelect, onMarkClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const paras: { start: number; text: string }[] = [];
  let pos = 0;
  for (const chunk of text.split(/\n\s*\n/)) {
    const start = text.indexOf(chunk, pos);
    paras.push({ start, text: chunk });
    pos = start + chunk.length;
  }

  function absOffset(node: Node, offset: number): number | null {
    let el: Node | null = node;
    while (el && !(el instanceof HTMLElement && el.dataset.off)) el = el.parentNode;
    if (!el) return null;
    const p = el as HTMLElement;
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let local = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n === node) return Number(p.dataset.off) + local + offset;
      local += n.textContent?.length ?? 0;
    }
    // Selection endpoint is an element rather than a text node
    return Number(p.dataset.off) + (node === p ? (offset === 0 ? 0 : p.textContent?.length ?? 0) : local);
  }

  function onMouseUp() {
    if (!onSelect) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return;
    const r = sel.getRangeAt(0);
    if (!ref.current.contains(r.startContainer) || !ref.current.contains(r.endContainer)) return;
    const a = absOffset(r.startContainer, r.startOffset);
    const b = absOffset(r.endContainer, r.endOffset);
    if (a === null || b === null || a === b) return;
    onSelect(Math.min(a, b), Math.max(a, b), r.getBoundingClientRect());
  }

  return (
    <div className="passage" ref={ref} onMouseUp={onMouseUp}>
      {paras.map((p) => (
        <p key={p.start} data-off={p.start}>
          {renderSegments(p.text, p.start, marks, onMarkClick)}
        </p>
      ))}
    </div>
  );
}

function renderSegments(text: string, base: number, marks: Mark[], onMarkClick?: Props['onMarkClick']) {
  const end = base + text.length;
  const relevant = marks.filter((m) => m.end > base && m.start < end).sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let cur = base;
  for (const m of relevant) {
    const s = Math.max(m.start, cur);
    const e = Math.min(m.end, end);
    if (e <= s) continue;
    if (s > cur) out.push(text.slice(cur - base, s - base));
    out.push(
      <mark
        key={m.id + s}
        className={m.kind === 'hl' ? '' : m.kind}
        title={m.note}
        id={m.kind === 'locate' ? 'locate-target' : undefined}
        onClick={(ev) => onMarkClick?.(m, (ev.target as HTMLElement).getBoundingClientRect())}
      >
        {text.slice(s - base, e - base)}
      </mark>,
    );
    cur = e;
  }
  if (cur < end) out.push(text.slice(cur - base));
  return out;
}
