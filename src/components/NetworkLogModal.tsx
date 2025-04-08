import React from "react";
import { X } from "lucide-react";
import { NetworkEvent } from "../types";

interface NetworkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: NetworkEvent[];
}

function NetworkLogModal({ isOpen, onClose, events }: NetworkLogModalProps) {
  if (!isOpen) return null;

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getEventDescription = (event: NetworkEvent) => {
    switch (event.type) {
      case "node_added":
        return `Node ${event.details.nodeId} added at position (${event.details.position?.x}, ${event.details.position?.y})`;
      case "node_moved":
        return `Node ${event.details.nodeId} moved to position (${event.details.position?.x}, ${event.details.position?.y})`;
      case "link_created":
        return `Link created between ${event.details.fromNode} and ${event.details.toNode}`;
      case "packet_sent":
        return `Packet ${event.details.packetId} sent from ${event.details.fromNode} to ${event.details.toNode}`;
      case "node_removed":
        return `Node ${event.details.nodeId} removed`;
      default:
        return "Unknown event";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
          {events.length === 0 ? (
            <p className="text-neutral-400 text-sm">
              No network events recorded
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="text-sm p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>{formatTimestamp(event.timestamp)}</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">
                      {event.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-neutral-50">
                    {getEventDescription(event)}
                  </p>
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
