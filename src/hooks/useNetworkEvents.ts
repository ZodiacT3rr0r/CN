import { useState } from "react";
import { NetworkEvent } from "../types";

export function useNetworkEvents() {
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [isNetworkLogOpen, setIsNetworkLogOpen] = useState(false);

  const addNetworkEvent = (event: Omit<NetworkEvent, "id" | "timestamp">) => {
    setNetworkEvents((prev) => [
      ...prev,
      {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    ]);
  };

  const clearNetworkEvents = () => {
    setNetworkEvents([]);
  };

  const formatNetworkEvent = (event: NetworkEvent): string => {
    const timestamp = event.timestamp.toLocaleTimeString();
    switch (event.type) {
      case "node_added":
        return `[${timestamp}] Node ${event.details.nodeId} added at position (${event.details.position?.x}, ${event.details.position?.y})`;
      case "node_moved":
        return `[${timestamp}] Node ${event.details.nodeId} moved to position (${event.details.position?.x}, ${event.details.position?.y})`;
      case "link_created":
        return `[${timestamp}] Link created between ${event.details.fromNode} and ${event.details.toNode}`;
      case "packet_sent":
        return `[${timestamp}] Packet ${event.details.packetId} sent from ${event.details.fromNode} to ${event.details.toNode}`;
      case "node_removed":
        return `[${timestamp}] Node ${event.details.nodeId} removed`;
      default:
        return `[${timestamp}] Unknown event`;
    }
  };

  return {
    networkEvents,
    isNetworkLogOpen,
    setIsNetworkLogOpen,
    addNetworkEvent,
    clearNetworkEvents,
    formatNetworkEvent,
  };
}
