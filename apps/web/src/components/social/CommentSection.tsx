'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  Collapse,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Reply as ReplyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Comment, useSocialStore, formatRelativeTime } from '@/lib/stores/socialStore';

interface CommentSectionProps {
  sessionId: string;
  initialComments?: Comment[];
  currentUserId?: string;
}

interface CommentItemProps {
  comment: Comment;
  sessionId: string;
  currentUserId?: string;
  onReply: (commentId: string, userName: string) => void;
  depth?: number;
}

function CommentItem({ comment, sessionId, currentUserId, onReply, depth = 0 }: CommentItemProps) {
  const theme = useTheme();
  const [showReplies, setShowReplies] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const { likeComment, editComment, deleteComment } = useSocialStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLike = async () => {
    await likeComment(sessionId, comment.id);
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await editComment(sessionId, comment.id, editContent);
    }
    setIsEditing(false);
    handleMenuClose();
  };

  const handleDelete = async () => {
    await deleteComment(sessionId, comment.id);
    handleMenuClose();
  };

  const isOwner = currentUserId === comment.userId;
  const maxDepth = 3;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      sx={{
        ml: depth > 0 ? 4 : 0,
        pl: depth > 0 ? 2 : 0,
        borderLeft: depth > 0 ? `2px solid ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar
          component={Link}
          href={`/profile/${comment.userId}`}
          src={comment.userAvatar}
          alt={comment.userName}
          sx={{ width: 36, height: 36, cursor: 'pointer' }}
        >
          {comment.userName.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  component={Link}
                  href={`/profile/${comment.userId}`}
                  variant="titleSmall"
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {comment.userName}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  {formatRelativeTime(comment.timestamp)}
                </Typography>
                {comment.isEdited && (
                  <Typography variant="bodySmall" color="text.secondary">
                    (edited)
                  </Typography>
                )}
              </Box>

              {isOwner && (
                <>
                  <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => { setIsEditing(true); handleMenuClose(); }}>
                      <EditIcon sx={{ mr: 1 }} fontSize="small" />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                      <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                      Delete
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>

            {isEditing ? (
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  size="small"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" onClick={handleEdit}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="bodyMedium" sx={{ mt: 0.5 }}>
                {comment.content}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" onClick={handleLike}>
                {comment.isLiked ? (
                  <FavoriteIcon fontSize="small" sx={{ color: 'error.main' }} />
                ) : (
                  <FavoriteBorderIcon fontSize="small" />
                )}
              </IconButton>
              <Typography variant="bodySmall" color="text.secondary">
                {comment.likeCount}
              </Typography>
            </Box>

            {depth < maxDepth && (
              <Button
                size="small"
                startIcon={<ReplyIcon fontSize="small" />}
                onClick={() => onReply(comment.id, comment.userName)}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Reply
              </Button>
            )}
          </Box>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <>
              <Button
                size="small"
                onClick={() => setShowReplies(!showReplies)}
                startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>

              <Collapse in={showReplies}>
                <Box sx={{ mt: 1 }}>
                  <AnimatePresence>
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        sessionId={sessionId}
                        currentUserId={currentUserId}
                        onReply={onReply}
                        depth={depth + 1}
                      />
                    ))}
                  </AnimatePresence>
                </Box>
              </Collapse>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function CommentSection({ sessionId, initialComments = [], currentUserId }: CommentSectionProps) {
  const theme = useTheme();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialComments.length);

  const { loadComments, addComment, sessionComments } = useSocialStore();

  useEffect(() => {
    if (!initialComments.length) {
      loadComments(sessionId).then(() => setIsLoading(false));
    }
  }, [sessionId, initialComments.length, loadComments]);

  useEffect(() => {
    if (sessionComments[sessionId]) {
      setComments(sessionComments[sessionId]);
    }
  }, [sessionComments, sessionId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(sessionId, newComment, replyTo?.id);
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, userName });
    // Focus the input
    const input = document.getElementById('comment-input');
    input?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Comment Input */}
      <Box sx={{ mb: 3 }}>
        {replyTo && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography variant="bodySmall">
              Replying to <strong>@{replyTo.userName}</strong>
            </Typography>
            <Button size="small" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36 }}>U</Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              id="comment-input"
              fullWidth
              multiline
              maxRows={4}
              placeholder={replyTo ? `Reply to @${replyTo.userName}...` : 'Write a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Comments List */}
      {comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="bodyLarge" color="text.secondary">
            No comments yet. Be the first to comment!
          </Typography>
        </Box>
      ) : (
        <AnimatePresence>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              sessionId={sessionId}
              currentUserId={currentUserId}
              onReply={handleReply}
            />
          ))}
        </AnimatePresence>
      )}
    </Box>
  );
}
