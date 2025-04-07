import { Circle } from "lucide-react";

export interface Device {
  id: string;
  type: "pc" | "router" | "switch";
  color: string;
  icon: typeof Circle;
}

// Enriched versions of each device type
export interface SwitchDevice extends Device {
  type: "switch";
  ports: number;
}

export interface RouterDevice extends Device {
  type: "router";
  gateway: string;
  subnet: string;
}

export interface PCDevice extends Device {
  type: "pc";
  ipAddress: string;
  dns: string;
}

// Common position interface for canvas placement
export interface Position {
  x: number;
  y: number;
}

// Instance of a device placed on the canvas
export interface DeviceInstance extends Device {
  instanceId: string;
  position: Position;

  // Optional config for simulating routing later
  ipAddress?: string;
  gateway?: string;
  subnet?: string;
  dns?: string;
}

// Connection between two placed devices
export interface Link {
  from: string;
  to: string;
}

// Network topology: who is connected to whom
export interface Topology {
  [nodeId: string]: string[]; // list of neighbor instanceIds
}

// Each node's computed routing table (shortest path by hops)
export interface RoutingTable {
  [destinationId: string]: {
    nextHop: string;
    hops: number;
  };
}
