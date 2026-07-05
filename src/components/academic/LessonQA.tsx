"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string; content: string; parent_id: string | null; created_at: string; author_id: string;
  author: { full_name: string; role: string } | null;
}

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export function LessonQA({ materialId, profileId, isTeacher }: { materialId: string; profileId: string; isTeacher: boolean }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data } = await (supabase.from("lesson_comments") as any)
      .select("id,content,parent_id,created_at,author_id")
      .eq("lesson_id", materialId)
      .order("created_at", { ascending: true });
    const rows = data ?? [];

    const authorIds = Array.from(new Set(rows.map((r: { author_id: string }) => r.author_id)));
    let authors: Record<string, { full_name: string; role: string }> = {};
    if (authorIds.length > 0) {
      const { data: authorRows } = await supabase.rpc("get_comment_authors", { author_ids: authorIds } as any);
      authors = Object.fromEntries((authorRows ?? []).map((a: { id: string; full_name: string; role: string }) => [a.id, { full_name: a.full_name, role: a.role }]));
    }

    setComments(rows.map((r: Comment) => ({ ...r, author: authors[r.author_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [materialId]); // eslint-disable-line react-hooks/exhaustive-deps

  const askQuestion = async () => {
    if (!question.trim()) return;
    setPosting(true);
    await (supabase.from("lesson_comments") as any).insert({ lesson_id: materialId, author_id: profileId, content: question.trim(), parent_id: null });
    setQuestion("");
    setPosting(false);
    load();
  };

  const postReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setPosting(true);
    await (supabase.from("lesson_comments") as any).insert({ lesson_id: materialId, author_id: profileId, content: replyText.trim(), parent_id: parentId });
    setReplyText("");
    setReplyTo(null);
    setPosting(false);
    load();
  };

  const questions = comments.filter(c => !c.parent_id);
  const repliesFor = (id: string) => comments.filter(c => c.parent_id === id);

  const inp: React.CSSProperties = { flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 12, outline: "none" };

  if (loading) return <p style={{ fontSize: 12, color: S.dim }}>Loading questions…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
      {questions.length === 0 && (
        <p style={{ fontSize: 12, color: S.dim, margin: 0 }}>No questions yet — be the first to ask.</p>
      )}
      {questions.map(q => (
        <div key={q.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: S.text, margin: 0 }}>{q.author?.full_name ?? "Student"}</p>
            <span style={{ fontSize: 10, color: S.dim }}>{new Date(q.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{q.content}</p>

          {repliesFor(q.id).map(r => (
            <div key={r.id} style={{ marginTop: 8, marginLeft: 14, paddingLeft: 10, borderLeft: `2px solid ${r.author?.role === "teacher" ? "rgba(0,229,163,0.3)" : S.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: r.author?.role === "teacher" ? "#00E5A3" : S.text, margin: 0 }}>{r.author?.full_name ?? "User"}</p>
                {r.author?.role === "teacher" && <span style={{ fontSize: 9, color: "#00E5A3", background: "rgba(0,229,163,0.1)", padding: "1px 6px", borderRadius: 10 }}>Teacher</span>}
              </div>
              <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0", lineHeight: 1.5 }}>{r.content}</p>
            </div>
          ))}

          {replyTo === q.id ? (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" style={inp}
                onKeyDown={e => { if (e.key === "Enter") postReply(q.id); }} autoFocus />
              <button onClick={() => postReply(q.id)} disabled={posting || !replyText.trim()}
                style={{ padding: "6px 12px", borderRadius: 8, background: S.accent, border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Reply</button>
              <button onClick={() => { setReplyTo(null); setReplyText(""); }} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 11 }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setReplyTo(q.id)} style={{ marginTop: 6, background: "none", border: "none", color: S.accent, cursor: "pointer", fontSize: 11, padding: 0 }}>Reply</button>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 6 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about this lesson…" style={inp}
          onKeyDown={e => { if (e.key === "Enter") askQuestion(); }} />
        <button onClick={askQuestion} disabled={posting || !question.trim()}
          style={{ padding: "8px 14px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          {isTeacher ? "Post" : "Ask"}
        </button>
      </div>
    </div>
  );
}
