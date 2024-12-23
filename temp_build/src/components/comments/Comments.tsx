import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取评论列表
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comment?postId=${postId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // 提交新评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !author.trim()) {
      setError('请填写评论内容和昵称');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          author,
          postId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchComments(); // 重新获取评论列表
      } else {
        setError(data.error || '评论失败，请重试');
      }
    } catch (error) {
      setError('评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">评论区</h2>
      
      {/* 评论列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-white">
                  {comment.author}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{comment.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-500 dark:bg-red-900/50">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="author" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            昵称
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="请输入你的昵称"
          />
        </div>

        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            评论内容
          </label>
          <textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="写下你的评论..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded-lg px-4 py-2 text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? '提交中...' : '发表评论'}
        </button>
      </form>
    </div>
  );
} 