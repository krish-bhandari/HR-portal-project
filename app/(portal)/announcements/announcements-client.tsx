"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate, getInitials } from "@/lib/utils";
import { Pin, Heart, Lightbulb, MessageCircle, Edit3, Trash2, X, Image, Send, ChevronDown, ChevronUp, Plus } from "lucide-react";

interface Props {
  member: any;
  initialPosts: any[];
}

export default function AnnouncementsClient({ member, initialPosts }: Props) {
  const supabase = createClient();
  const isAdmin = member?.role === "admin";
  const [posts, setPosts] = useState(initialPosts);
  const [showCompose, setShowCompose] = useState(false);

  // Compose state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  async function handlePost() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);

    // Upload media if any
    const mediaUrls: string[] = [];
    for (const file of mediaFiles) {
      const filename = `announcements/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("media").upload(filename, file);
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.path);
        mediaUrls.push(urlData.publicUrl);
      }
    }

    const { data, error } = await supabase.from("announcements").insert({
      author_id: member.id,
      title: title.trim(),
      body_html: body.trim(),
      body_json: {},
      media_urls: mediaUrls,
      is_pinned: isPinned,
    }).select(`*, author:team_members!announcements_author_id_fkey(name, avatar_url, designation), reactions:announcement_reactions(user_id, type)`).single();

    if (error) {
      toast.error("Failed to post: " + error.message);
    } else {
      toast.success("Announcement posted!");
      setPosts((prev: any[]) => [data, ...prev.filter((p: any) => !p.is_pinned)]);
      setShowCompose(false);
      setTitle(""); setBody(""); setIsPinned(false); setMediaFiles([]);
    }
    setSubmitting(false);
  }

  async function handleReaction(postId: string, type: "knowledge" | "love") {
    const post = posts.find((p: any) => p.id === postId);
    const existing = post?.reactions?.find((r: any) => r.user_id === member.id && r.type === type);

    if (existing) {
      await supabase.from("announcement_reactions").delete().eq("post_id", postId).eq("user_id", member.id).eq("type", type);
      setPosts((prev: any[]) => prev.map((p: any) => p.id === postId
        ? { ...p, reactions: p.reactions.filter((r: any) => !(r.user_id === member.id && r.type === type)) }
        : p
      ));
    } else {
      await supabase.from("announcement_reactions").insert({ post_id: postId, user_id: member.id, type });
      setPosts((prev: any[]) => prev.map((p: any) => p.id === postId
        ? { ...p, reactions: [...(p.reactions ?? []), { user_id: member.id, type }] }
        : p
      ));
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", postId);
    setPosts((prev: any[]) => prev.filter((p: any) => p.id !== postId));
    toast.success("Announcement deleted");
  }

  function toggleReplies(postId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  const pinnedPosts = posts.filter((p: any) => p.is_pinned);
  const regularPosts = posts.filter((p: any) => !p.is_pinned);

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Stay updated with the latest from RISE Research</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
            <Plus size={16} />
            New Post
          </button>
        )}
      </div>

      {/* Pinned section */}
      {pinnedPosts.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Pin size={14} color="var(--rise-gold)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--rise-gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pinned</span>
          </div>
          {pinnedPosts.map((post: any) => (
            <AnnouncementPost
              key={post.id}
              post={post}
              member={member}
              isAdmin={isAdmin}
              onReaction={handleReaction}
              onDelete={handleDelete}
              expanded={expandedReplies.has(post.id)}
              onToggleReplies={() => toggleReplies(post.id)}
              supabase={supabase}
            />
          ))}
        </div>
      )}

      {/* Regular posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {regularPosts.length === 0 && pinnedPosts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Edit3 className="empty-state-icon" color="var(--text-muted)" />
              <div className="empty-state-title">No announcements yet</div>
              {isAdmin && <div className="empty-state-text">Post the first announcement for your team!</div>}
            </div>
          </div>
        ) : (
          regularPosts.map((post: any) => (
            <AnnouncementPost
              key={post.id}
              post={post}
              member={member}
              isAdmin={isAdmin}
              onReaction={handleReaction}
              onDelete={handleDelete}
              expanded={expandedReplies.has(post.id)}
              onToggleReplies={() => toggleReplies(post.id)}
              supabase={supabase}
            />
          ))
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCompose(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>New Announcement</h2>
              <button onClick={() => setShowCompose(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title..."
                className="form-input"
                style={{ fontSize: "1rem", fontWeight: 600 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Content *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement..."
                className="form-input"
                rows={6}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Media */}
            <div style={{ marginBottom: "1rem" }}>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))} />
              {mediaFiles.length > 0 ? (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {mediaFiles.map((f, i) => (
                    <div key={i} style={{ padding: "0.375rem 0.75rem", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 6, fontSize: "0.75rem", color: "var(--rise-gold)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Image size={12} />
                      {f.name}
                      <button onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              ) : null}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Image size={14} />
                Add Images / Video
              </button>
            </div>

            {/* Pin toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <input type="checkbox" id="pin" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--rise-gold)", cursor: "pointer" }} />
              <label htmlFor="pin" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>Pin this announcement</label>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePost} disabled={submitting}>
                {submitting ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementPost({ post, member, isAdmin, onReaction, onDelete, expanded, onToggleReplies, supabase }: any) {
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadedReplies, setLoadedReplies] = useState(false);
  const [postingReply, setPostingReply] = useState(false);

  const knowledgeCount = post.reactions?.filter((r: any) => r.type === "knowledge").length ?? 0;
  const loveCount = post.reactions?.filter((r: any) => r.type === "love").length ?? 0;
  const myKnowledge = post.reactions?.some((r: any) => r.user_id === member?.id && r.type === "knowledge");
  const myLove = post.reactions?.some((r: any) => r.user_id === member?.id && r.type === "love");

  async function loadReplies() {
    if (loadedReplies) return;
    const { data } = await supabase.from("announcement_replies")
      .select("*, author:team_members!announcement_replies_author_id_fkey(name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at");
    setReplies(data ?? []);
    setLoadedReplies(true);
  }

  async function handleToggle() {
    onToggleReplies();
    if (!loadedReplies) await loadReplies();
  }

  async function postReply() {
    if (!replyText.trim()) return;
    setPostingReply(true);
    const { data, error } = await supabase.from("announcement_replies").insert({
      post_id: post.id,
      author_id: member.id,
      body: replyText.trim(),
      mentions: [],
    }).select("*, author:team_members!announcement_replies_author_id_fkey(name, avatar_url)").single();
    if (!error && data) {
      setReplies((prev: any[]) => [...prev, data]);
      setReplyText("");
      toast.success("Reply posted");
    }
    setPostingReply(false);
  }

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(date);
  };

  return (
    <div className="card" style={{ borderLeft: post.is_pinned ? "3px solid var(--rise-gold)" : undefined }}>
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
          {post.author?.avatar_url
            ? <img src={post.author.avatar_url} alt={post.author.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
            : getInitials(post.author?.name ?? "?")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{post.author?.name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{post.author?.designation} · {timeAgo(post.created_at)}</div>
        </div>
        {post.is_pinned && <Pin size={14} color="var(--rise-gold)" />}
        {isAdmin && (
          <button onClick={() => onDelete(post.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem" }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", fontFamily: "'Playfair Display', serif" }}>
        {post.title}
      </h3>
      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{post.body_html}</p>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          {post.media_urls.map((url: string, i: number) => (
            <img key={i} src={url} alt="media" style={{ height: 120, borderRadius: 8, objectFit: "cover", border: "1px solid var(--bg-border)" }} />
          ))}
        </div>
      )}

      {/* Reactions + Reply */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.875rem", borderTop: "1px solid var(--bg-border)" }}>
        <button
          onClick={() => onReaction(post.id, "knowledge")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: 8, background: myKnowledge ? "rgba(212,175,55,0.15)" : "transparent", border: `1px solid ${myKnowledge ? "rgba(212,175,55,0.3)" : "var(--bg-border)"}`, cursor: "pointer", transition: "all 0.15s" }}
        >
          <Lightbulb size={15} color={myKnowledge ? "var(--rise-gold)" : "var(--text-muted)"} />
          <span style={{ fontSize: "0.8rem", color: myKnowledge ? "var(--rise-gold)" : "var(--text-muted)", fontWeight: 600 }}>{knowledgeCount || ""}</span>
        </button>

        <button
          onClick={() => onReaction(post.id, "love")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: 8, background: myLove ? "rgba(236,72,153,0.15)" : "transparent", border: `1px solid ${myLove ? "rgba(236,72,153,0.3)" : "var(--bg-border)"}`, cursor: "pointer", transition: "all 0.15s" }}
        >
          <Heart size={15} color={myLove ? "#ec4899" : "var(--text-muted)"} fill={myLove ? "#ec4899" : "none"} />
          <span style={{ fontSize: "0.8rem", color: myLove ? "#ec4899" : "var(--text-muted)", fontWeight: 600 }}>{loveCount || ""}</span>
        </button>

        <button onClick={handleToggle} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: 8, background: "transparent", border: "1px solid var(--bg-border)", cursor: "pointer" }}>
          <MessageCircle size={15} color="var(--text-muted)" />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Reply</span>
          {expanded ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
        </button>
      </div>

      {/* Replies section */}
      {expanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)" }}>
          {replies.map((reply: any) => (
            <div key={reply.id} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.875rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-border)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                {getInitials(reply.author?.name ?? "?")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  {reply.author?.name} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {timeAgo(reply.created_at)}</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{reply.body}</p>
              </div>
            </div>
          ))}

          {/* Reply input */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && postReply()}
              placeholder="Write a reply..."
              className="form-input"
              style={{ fontSize: "0.85rem" }}
            />
            <button className="btn btn-primary btn-sm" onClick={postReply} disabled={postingReply || !replyText.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
