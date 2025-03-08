import { toast } from "sonner";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

/**
 * A simple confirmation dialog using Sonner toast
 * This avoids accessibility issues with the Radix UI alert dialog
 */
export function confirm({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmOptions) {
  toast(
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {confirmText}
        </button>
        <button
          onClick={() => {
            toast.dismiss();
            onCancel?.();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {cancelText}
        </button>
      </div>
    </div>,
    {
      duration: 10000, // 10 seconds
      position: "top-center",
      className: "w-full max-w-md p-4 bg-white rounded-lg shadow-lg",
    }
  );
} 