import React, { useState, useEffect, useCallback } from 'react';
import { getComments, addComment, deleteComment } from '../services/api';

const CommentSection = ({ ticketId, currentUser }) => {
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [focused, setFocused]       = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getComments(ticketId);
      setComments(res.data.data);
    } catch (err) {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await addComment(ticketId, { content: newComment });
      setComments((prev) => [...prev, res.data.data]);
      setNewComment('');
    } catch (err) {
      setError('Failed to post comment.');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(ticketId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError('Failed to delete comment.');
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>
          forum
        </span>
        <span style={{ color: '#e2e2e2', fontWeight: 600, fontSize: '15px' }}>
          Discussion
        </span>
        {!loading && (
          <span style={{
            marginLeft: '4px',
            background: 'rgba(137,207,240,0.12)',
            color: '#89CFF0',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            letterSpacing: '0.05em'
          }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(255,180,171,0.08)',
          border: '1px solid rgba(255,180,171,0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          color: '#ffb4ab',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ color: '#899297', fontSize: '13px', padding: '8px 0' }}>
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        /* ── Empty state ── */
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: '#899297',
          fontSize: '13px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>
            chat_bubble_outline
          </span>
          No comments yet — be the first to add one!
        </div>
      ) : (
        /* ── Comment list ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #89CFF0, #005974)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {getInitial(comment.username)}
                  </div>
                  <span style={{ color: '#e2e2e2', fontWeight: 600, fontSize: '13px' }}>
                    {comment.username}
                  </span>
                  <span style={{ color: '#899297', fontSize: '11px' }}>
                    {formatDate(comment.created_at)}
                  </span>
                </div>

                {/* Delete button */}
                {(currentUser?.role === 'admin' || currentUser?.username === comment.username) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    title="Delete comment"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#899297',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ffb4ab'}
                    onMouseLeave={e => e.currentTarget.style.color = '#899297'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      delete
                    </span>
                  </button>
                )}
              </div>

              {/* Content */}
              <p style={{
                color: '#bfc8cd',
                fontSize: '13px',
                lineHeight: '1.6',
                margin: 0,
                paddingLeft: '40px'
              }}>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── New comment form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          placeholder="Add a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: focused
              ? '1px solid #89CFF0'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 0 15px rgba(137,207,240,0.15)' : 'none',
            borderRadius: '12px',
            padding: '12px 14px',
            color: '#e2e2e2',
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={!newComment.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: newComment.trim()
                ? 'linear-gradient(135deg, #89CFF0, #005974)'
                : 'rgba(255,255,255,0.05)',
              color: newComment.trim() ? '#003546' : '#899297',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            Post Comment
          </button>
        </div>
      </form>

    </div>
  );
};

export default CommentSection;