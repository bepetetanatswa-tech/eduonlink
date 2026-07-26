import type { ReactNode } from "react";

// Minimal, safe subset of markdown for announcements: **bold**, *italic*,
// [text](url) links, and "- " list lines. Never touches innerHTML — only
// ever builds React elements, so there's no injection risk from user text.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{match[2]}</em>);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      nodes.push(
        <a key={`${keyPrefix}-${i++}`} href={match[4]} target="_blank" rel="noreferrer" style={{ color: "#B1502B" }}>
          {match[3]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function renderSimpleMarkdown(content: string): ReactNode {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key} style={{ margin: "4px 0", paddingLeft: 20 }}>
        {listItems.map((item, idx) => <li key={idx}>{renderInline(item, `${key}-li-${idx}`)}</li>)}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    if (/^\s*-\s+/.test(line)) {
      listItems.push(line.replace(/^\s*-\s+/, ""));
    } else {
      flushList(`list-${idx}`);
      if (line.trim() === "") {
        blocks.push(<br key={`br-${idx}`} />);
      } else {
        blocks.push(<span key={`line-${idx}`}>{renderInline(line, `line-${idx}`)}<br /></span>);
      }
    }
  });
  flushList("list-end");

  return blocks;
}
