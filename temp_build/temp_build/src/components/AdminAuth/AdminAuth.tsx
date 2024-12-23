import { useState } from 'react';
import { motion } from 'framer-motion';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminAuth({ onSuccess, onCancel }: AdminAuthProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '5070') {
      onSuccess();
    } else {
      setError('密码错误');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[400px] rounded-lg bg-white p-6 dark:bg-gray-800"
      >
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          管理员验证
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              请输入管理员密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-transparent p-2 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
              placeholder="请输入密码"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              确认
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 