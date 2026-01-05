// src/content/toast.ts

/**
 * Toast notification system for Word Memo
 */

export type ToastStatus = 'loading' | 'success' | 'error' | 'warning';

interface ToastOptions {
  word: string;
  status: ToastStatus;
  message?: string;
  autoClose?: boolean;
  duration?: number;
}

interface Toast {
  id: string;
  element: HTMLDivElement;
  timer?: ReturnType<typeof setTimeout>;
}

const toasts: Map<string, Toast> = new Map();
let containerElement: HTMLDivElement | null = null;

// Ensure toast container exists
function ensureContainer(): HTMLDivElement {
  if (containerElement && document.body.contains(containerElement)) {
    return containerElement;
  }

  containerElement = document.createElement('div');
  containerElement.id = 'word-memo-toast-container';
  containerElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  `;
  document.body.appendChild(containerElement);

  return containerElement;
}

// Get icon and color for status
function getStatusConfig(status: ToastStatus): { icon: string; color: string; bgColor: string } {
  switch (status) {
    case 'loading':
      return { icon: '⏳', color: '#3B82F6', bgColor: '#EFF6FF' };
    case 'success':
      return { icon: '✓', color: '#10B981', bgColor: '#F0FDF4' };
    case 'error':
      return { icon: '✕', color: '#EF4444', bgColor: '#FEF2F2' };
    case 'warning':
      return { icon: '⚠', color: '#F59E0B', bgColor: '#FFFBEB' };
  }
}

// Get message text
function getMessageText(word: string, status: ToastStatus, customMessage?: string): string {
  if (customMessage) return customMessage;

  switch (status) {
    case 'loading':
      return `添加 "${word}" 中...`;
    case 'success':
      return `已添加 "${word}"`;
    case 'error':
      return `添加 "${word}" 失败`;
    case 'warning':
      return `"${word}" 已在词库中`;
  }
}

// Create toast element
function createToastElement(options: ToastOptions): HTMLDivElement {
  const { word, status, message } = options;
  const config = getStatusConfig(status);
  const messageText = getMessageText(word, status, message);

  const toast = document.createElement('div');
  toast.className = 'word-memo-toast';
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border-left: 4px solid ${config.color};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;

  // Icon
  const iconEl = document.createElement('div');
  iconEl.style.cssText = `
    font-size: 20px;
    line-height: 1;
    ${status === 'loading' ? 'animation: spin 1s linear infinite;' : ''}
  `;
  iconEl.textContent = config.icon;

  // Message
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    flex: 1;
    font-size: 14px;
    color: #1F2937;
    line-height: 1.5;
  `;
  messageEl.textContent = messageText;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  `;
  closeBtn.innerHTML = '×';
  closeBtn.onmouseover = () => (closeBtn.style.color = '#4B5563');
  closeBtn.onmouseout = () => (closeBtn.style.color = '#9CA3AF');
  closeBtn.onclick = () => {
    removeToast(word);
  };

  toast.appendChild(iconEl);
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);

  return toast;
}

// Inject animations CSS
function injectStyles() {
  if (document.getElementById('word-memo-toast-styles')) return;

  const style = document.createElement('style');
  style.id = 'word-memo-toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Show or update toast notification
 */
export function showToast(options: ToastOptions): void {
  injectStyles();
  const container = ensureContainer();
  const { word, status, autoClose = status !== 'loading', duration = 2000 } = options;

  // If toast already exists, update it
  if (toasts.has(word)) {
    updateToast(options);
    return;
  }

  // Create new toast
  const element = createToastElement(options);
  const toast: Toast = { id: word, element };

  toasts.set(word, toast);
  container.appendChild(element);

  // Auto-close timer
  if (autoClose) {
    toast.timer = setTimeout(() => {
      removeToast(word);
    }, duration);
  }
}

/**
 * Update existing toast
 */
export function updateToast(options: ToastOptions): void {
  const { word, status, autoClose = status !== 'loading', duration = 2000 } = options;
  const toast = toasts.get(word);

  if (!toast) {
    showToast(options);
    return;
  }

  // Clear existing timer
  if (toast.timer) {
    clearTimeout(toast.timer);
    toast.timer = undefined;
  }

  // Update element
  const newElement = createToastElement(options);
  toast.element.replaceWith(newElement);
  toast.element = newElement;

  // Auto-close timer
  if (autoClose) {
    toast.timer = setTimeout(() => {
      removeToast(word);
    }, duration);
  }
}

/**
 * Remove toast
 */
export function removeToast(word: string): void {
  const toast = toasts.get(word);
  if (!toast) return;

  // Clear timer
  if (toast.timer) {
    clearTimeout(toast.timer);
  }

  // Animate out
  toast.element.style.animation = 'slideOut 0.3s ease-in';
  setTimeout(() => {
    toast.element.remove();
    toasts.delete(word);

    // Remove container if empty
    if (toasts.size === 0 && containerElement) {
      containerElement.remove();
      containerElement = null;
    }
  }, 300);
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  toasts.forEach((_, word) => removeToast(word));
}
