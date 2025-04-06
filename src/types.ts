import { Circle } from "lucide-react";

export interface Device {
  id: string;
  type: "pc" | "router" | "switch";
  color: string;
  icon: typeof Circle;
}

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

// add ipadd/gateway/subnet/dns above

export interface Position {
  x: number;
  y: number;
}

export interface DeviceInstance extends Device {
  instanceId: string;
  position: Position;
}

export interface Link {
  from: string; 
  to: string;   
}
