import { useState } from "react";
import { Device, DeviceInstance } from "../types";
import { Router, MonitorSmartphone, HardDrive } from "lucide-react";

export function useDevices() {
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [routerCount, setRouterCount] = useState(0);
  const [pcCount, setPcCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);

  const availableDevices: Device[] = [
    { id: "router", icon: Router, color: "bg-blue-500", type: "router" },
    { id: "pc", icon: MonitorSmartphone, color: "bg-green-500", type: "pc" },
    { id: "switch", icon: HardDrive, color: "bg-purple-500", type: "switch" },
  ];

  const handleDrop = (
    device: Device,
    x: number,
    y: number,
    onNetworkEvent: (event: any) => void
  ) => {
    let instanceId = "";
    if (device.type === "router") instanceId = `R${routerCount + 1}`;
    if (device.type === "pc") instanceId = `P${pcCount + 1}`;
    if (device.type === "switch") instanceId = `S${switchCount + 1}`;

    const newDevice: DeviceInstance = {
      ...device,
      instanceId,
      deviceType: device.type,
      name: `${device.type.toUpperCase()}${instanceId.slice(1)}`,
      position: { x, y },
      interfaces: [],
    };

    setDevices((prev) => {
      const newDevices = [...prev, newDevice];
      if (device.type === "router") setRouterCount((c) => c + 1);
      if (device.type === "pc") setPcCount((c) => c + 1);
      if (device.type === "switch") setSwitchCount((c) => c + 1);

      onNetworkEvent({
        type: "node_added",
        details: {
          nodeId: instanceId,
          position: { x, y },
        },
      });

      return newDevices;
    });

    return instanceId;
  };

  const handleMove = (
    instanceId: string,
    x: number,
    y: number,
    onNetworkEvent: (event: any) => void
  ) => {
    setDevices((prev) => {
      const newDevices = prev.map((device) =>
        device.instanceId === instanceId
          ? { ...device, position: { x, y } }
          : device
      );

      onNetworkEvent({
        type: "node_moved",
        details: {
          nodeId: instanceId,
          position: { x, y },
        },
      });

      return newDevices;
    });
  };

  const handleDelete = (
    deviceId: string,
    onNetworkEvent: (event: any) => void
  ) => {
    const deviceToDelete = devices.find((d) => d.instanceId === deviceId);
    if (!deviceToDelete) return;

    setDevices((prev) => {
      const newDevices = prev.filter((d) => d.instanceId !== deviceId);

      if (deviceToDelete.deviceType === "router") setRouterCount((c) => c - 1);
      if (deviceToDelete.deviceType === "pc") setPcCount((c) => c - 1);
      if (deviceToDelete.deviceType === "switch") setSwitchCount((c) => c - 1);

      onNetworkEvent({
        type: "node_removed",
        details: {
          nodeId: deviceId,
        },
      });

      return newDevices;
    });

    setSelected(null);
  };

  const resetDevices = () => {
    setDevices([]);
    setSelected(null);
    setRouterCount(0);
    setPcCount(0);
    setSwitchCount(0);
  };

  return {
    devices,
    setDevices,
    selected,
    setSelected,
    availableDevices,
    routerCount,
    pcCount,
    switchCount,
    handleDrop,
    handleMove,
    handleDelete,
    resetDevices,
  };
}
