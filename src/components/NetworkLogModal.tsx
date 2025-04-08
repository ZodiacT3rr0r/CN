import React from "react";
import { X } from "lucide-react";

interface NetworkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

function NetworkLogModal({ isOpen, onClose, logs }: NetworkLogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-neutral-50 font-medium">Network Log</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {logs.length === 0 ? (
            <p className="text-neutral-400 text-sm">
              No network events recorded
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="text-sm p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                >
                  <p className="text-neutral-50">{log}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkLogModal;
