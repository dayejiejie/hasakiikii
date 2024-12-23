"use client";

import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface MessageProps {
  content: string;
  type?: "info" | "success" | "error" | "warning";
  duration?: number;
  onClose?: () => void;
}

const MessageComponent = ({ content, type = "info", duration = 3000, onClose }: MessageProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 transform rounded-lg px-6 py-3 text-white shadow-lg ${getTypeStyles()}`}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const message = {
  info: (content: string, duration?: number) => {
    showMessage({ content, type: "info", duration });
  },
  success: (content: string, duration?: number) => {
    showMessage({ content, type: "success", duration });
  },
  error: (content: string, duration?: number) => {
    showMessage({ content, type: "error", duration });
  },
  warning: (content: string, duration?: number) => {
    showMessage({ content, type: "warning", duration });
  },
};

const showMessage = (props: MessageProps) => {
  const messageContainer = document.createElement("div");
  document.body.appendChild(messageContainer);

  const root = createRoot(messageContainer);
  root.render(
    <MessageComponent
      {...props}
      onClose={() => {
        root.unmount();
        messageContainer.remove();
      }}
    />
  );
};

export { message }; 