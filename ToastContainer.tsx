import React, { useEffect } from 'react';
import { useToast, ToastType } from '../../state/ToastContext';

interface ToastProps {
    toast: { id: number; message: string; type: ToastType };
    onDismiss: () => void;
}

const TOAST_CONFIG = {
    success: {
        bgColor: 'bg-green-600/90',
        borderColor: 'border-green-400',
        textColor: 'text-white',
        iconColor: 'text-green-200',
        title: 'Success!',
        icon: <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.418l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    },
    error: {
        bgColor: 'bg-red-600/90',
        borderColor: 'border-red-400',
        textColor: 'text-white',
        iconColor: 'text-red-200',
        title: 'Error!',
        icon: <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.418l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    },
    info: {
        bgColor: 'bg-blue-600/90',
        borderColor: 'border-blue-400',
        textColor: 'text-white',
        iconColor: 'text-blue-200',
        title: 'Info',
        icon: <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.418l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    }
};


const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onDismiss]);
    
    const config = TOAST_CONFIG[toast.type];

    return (
        <div className={`${config.bgColor} border ${config.borderColor} ${config.textColor} px-4 py-3 rounded-md relative shadow-lg animate-fade-in-up`} role="alert">
            <strong className="font-bold">{config.title} </strong>
            <span className="block sm:inline">{toast.message}</span>
            <button onClick={onDismiss} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Dismiss">
                <span className={config.iconColor}>{config.icon}</span>
            </button>
        </div>
    );
};


const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-5 right-5 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

export default ToastContainer;
