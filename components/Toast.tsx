
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="bg-stone-900 text-white p-4 rounded-lg shadow-xl flex items-center justify-between pointer-events-auto animate-fade-in border border-stone-700"
        >
          <div className="flex items-center gap-3">
             {toast.type === 'success' ? <CheckCircle className="text-emerald-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
             <span className="text-sm font-medium">{toast.message}</span>
          </div>
          <button onClick={() => onRemove(toast.id)} className="text-stone-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
