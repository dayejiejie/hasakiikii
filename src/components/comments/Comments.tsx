import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  date: string;
  parentId?: number;
}

interface CommentsProps {
  postId: number;
}

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState({ author: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch("/api/comments?postId=" + postId);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("获取评论失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.author.trim() || !newComment.content.trim()) {
      setError("请填写昵称和评论内容");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          ...newComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment({ author: "", content: "" });
      } else {
        throw new Error(data.error || "评论失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布评论时出错");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">
        评论 ({comments.length})
      </h2>

      {/* 评论列表 */}
      <div className="mb-8 space-y-6">
        <AnimatePresence>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
                >
                  <div className="mb-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              暂无评论，来发表第一条评论吧
            </p>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-white">
                    {comment.author}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(comment.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
              </motion.div>
            ))
          )}
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
          <label
            htmlFor="author"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            昵称
          </label>
          <input
            type="text"
            id="author"
            value={newComment.author}
            onChange={(e) =>
              setNewComment({ ...newComment, author: e.target.value })
            }
            className="w-full rounded-lg border border-gray-200 bg-transparent p-2 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
            placeholder="请输入你的昵称"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            评论内容
          </label>
          <textarea
            id="content"
            value={newComment.content}
            onChange={(e) =>
              setNewComment({ ...newComment, content: e.target.value })
            }
            className="h-32 w-full rounded-lg border border-gray-200 bg-transparent p-2 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
            placeholder="写下你的评论..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={"rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 " +
            (isSubmitting ? "cursor-not-allowed opacity-50" : "")}
        >
          {isSubmitting ? "发布中..." : "发表评论"}
        </button>
      </form>
    </div>
  );
} 