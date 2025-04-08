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
  deviceType: string;
  name: string;
  position: Position;
  interfaces: Interface[];

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
  weight: number;
}

// Network topology: who is connected to whom
export interface Topology {
  [nodeId: string]: string[]; // list of neighbor instanceIds
}

// Each node's computed routing table (shortest path by hops)
export interface RoutingTable {
  [destination: string]: {
    nextHop: string;
    cost: number;
  };
}

export interface Interface {
  id: string;
  name: string;
  ipAddress: string;
  subnetMask: string;
}

export interface DistanceVector {
  [destination: string]: number;
}

export interface RoutingUpdate {
  from: string;
  distanceVector: DistanceVector;
  timestamp: number;
}

export interface NetworkEvent {
  id: string;
  timestamp: Date;
  type:
    | "node_added"
    | "node_moved"
    | "link_created"
    | "packet_sent"
    | "node_removed";
  details: {
    nodeId?: string;
    position?: { x: number; y: number };
    fromNode?: string;
    toNode?: string;
    packetId?: number;
    packetType?: string;
  };
}

export interface NetworkState {
  devices: DeviceInstance[];
  links: Link[];
  routingTables: Record<string, RoutingTable>;
  distanceVectors: { [key: string]: DistanceVector };
  networkEvents: NetworkEvent[];
  routerCount: number;
  pcCount: number;
  switchCount: number;
  action: string; // Description of what action caused this state
}

export interface LSPacket {
  sourceId: string;
  sequenceNumber: number;
  neighbors: { id: string; cost: number }[];
}
