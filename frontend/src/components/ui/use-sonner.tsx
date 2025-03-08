import { toast } from "sonner";

// Re-export sonner toast function with shadcn-like interface
export const useToast = () => {
  return {
    toast,
    dismiss: toast.dismiss,
    error: (message: string, options = {}) => 
      toast.error(message, options),
    success: (message: string, options = {}) => 
      toast.success(message, options),
    info: (message: string, options = {}) => 
      toast(message, { ...options }),
    warning: (message: string, options = {}) => 
      toast(message, { ...options, className: "bg-yellow-200" }),
  };
};

export { toast }; 