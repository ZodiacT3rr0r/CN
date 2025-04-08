import { Circle } from "lucide-react";

export interface Device {
  id: "router" | "pc" | "switch";
  type: "router" | "pc" | "switch";
  color: string;
  icon: typeof Circle;
}

// Router device with specific properties
export interface RouterDevice extends Device {
  type: "router";
  gateway: string;
  subnet: string;
}

// Common position interface for canvas placement
export interface Position {
  x: number;
  y: number;
}

// Instance of a device placed on the canvas
export interface DeviceInstance extends Device {
  instanceId: string;
  deviceType: "router" | "pc" | "switch";
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
  type: "node_added" | "node_removed" | "link_created" | "link_removed" | "packet_sent";
  details: {
    nodeId?: string;
    position?: { x: number; y: number };
    from?: string;
    to?: string;
    packetId?: number;
  };
  id?: string;
  timestamp?: Date;
}

export interface NetworkState {
  devices: DeviceInstance[];
  links: Link[];
  routingTables: Record<string, RoutingTable>;
  distanceVectors: { [key: string]: DistanceVector };
  networkEvents: NetworkEvent[];
  routerCount: number;
  action: string; // Description of what action caused this state
}

export interface LinkState {
  nodeId: string;
  neighbors: { [key: string]: number }; // neighborId -> cost
  sequenceNumber: number;
  timestamp: number;
}

export interface LinkStateRoutingTable {
  destination: string;
  nextHop: string;
  cost: number;
  path: string[];
}

export interface LinkStateNetworkState {
  devices: DeviceInstance[];
  links: Link[];
  linkStates: { [key: string]: LinkState };
  routingTables: { [key: string]: LinkStateRoutingTable[] };
  networkEvents: NetworkEvent[];
  routerCount: number;
  action: string;
}
