import React, { useState, useEffect, useCallback } from 'react';
import { getComments, addComment, deleteComment } from '../services/api';

// ── CommentSection ────────────────────────────────────────────────────────────
// Displays all comments for a ticket and allows users to add/delete comments.
// Props:
//   ticketId  — the ID of the ticket whose comments we're showing
//   currentUser — the logged-in user object (from App.js state)

const CommentSection = ({ ticketId, currentUser }) => {
  const [comments, setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Fetch comments when the component mounts ────────────────────────────────
  // Wrapped in useCallback so it can safely be listed as a useEffect dependency
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

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Submit a new comment ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await addComment(ticketId, { content: newComment });
      // Append the new comment to the list without refetching
      setComments((prev) => [...prev, res.data.data]);
      setNewComment('');
    } catch (err) {
      setError('Failed to post comment.');
    }
  };

  // ── Delete a comment ────────────────────────────────────────────────────────
  // Only the comment author or an admin can delete
  const handleDelete = async (commentId) => {
    try {
      await deleteComment(ticketId, commentId);
      // Remove the deleted comment from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError('Failed to delete comment.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <p className="comment-loading">Loading comments...</p>;
  if (error)   return <p className="comment-error">{error}</p>;

  return (
    <div className="comment-section">
      <h4 className="comment-heading">Comments ({comments.length})</h4>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="comment-empty">No comments yet. Be the first to add one!</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{comment.username}</span>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="comment-content">{comment.content}</p>

              {/* Show delete button only for comment owner or admin */}
              {(currentUser?.role === 'admin' || currentUser?.username === comment.username) && (
                <button
                  className="comment-delete-btn"
                  onClick={() => handleDelete(comment.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* New comment form */}
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          className="comment-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <button className="comment-submit-btn" type="submit">
          Post Comment
        </button>
      </form>
    </div>
  );
};

export default CommentSection;