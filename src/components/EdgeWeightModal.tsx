import React, { useState } from "react";
import { X } from "lucide-react";

interface EdgeWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (weight: number) => void;
  onRemove?: () => void;
  fromNode: string;
  toNode: string;
  currentWeight?: number;
}

function EdgeWeightModal({
  isOpen,
  onClose,
  onSubmit,
  onRemove,
  fromNode,
  toNode,
  currentWeight,
}: EdgeWeightModalProps) {
  const [weight, setWeight] = useState(currentWeight?.toString() || "1");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseInt(weight);
    if (numWeight >= 1) {
      onSubmit(numWeight);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 w-[400px] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-neutral-50 font-medium">
            {currentWeight ? "Edit Edge Weight" : "Set Edge Weight"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-neutral-400 text-sm mb-2">
              Edge between {fromNode} and {toNode}
            </p>
            <input
              type="number"
              min="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input w-full"
              placeholder="Enter weight (≥ 1)"
            />
          </div>

          <div className="flex justify-end gap-2">
            {currentWeight && onRemove && (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Remove Edge
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!weight || parseInt(weight) < 1}
            >
              {currentWeight ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EdgeWeightModal;
