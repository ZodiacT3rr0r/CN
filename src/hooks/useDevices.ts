import { useState } from 'react';
import { Device, DeviceInstance } from '../types';

export const useDevices = () => {
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [routerCount, setRouterCount] = useState(0);
  const [pcCount, setPcCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);

  const handleDrop = (device: Device, x: number, y: number) => {
    let instanceId: string;
    let name: string;
    
    switch (device.type) {
      case "router":
        instanceId = `R${routerCount + 1}`;
        name = `ROUTER${instanceId.slice(1)}`;
        setRouterCount(c => c + 1);
        break;
      case "pc":
        instanceId = `PC${pcCount + 1}`;
        name = `PC${instanceId.slice(2)}`;
        setPcCount(c => c + 1);
        break;
      case "switch":
        instanceId = `S${switchCount + 1}`;
        name = `SWITCH${instanceId.slice(1)}`;
        setSwitchCount(c => c + 1);
        break;
      default:
        throw new Error(`Unknown device type: ${device.type}`);
    }

    const newDevice: DeviceInstance = {
      ...device,
      instanceId,
      deviceType: device.type,
      name,
      position: { x, y },
      interfaces: [],
    };

    setDevices(prev => [...prev, newDevice]);

    return {
      instanceId,
      action: `add_${device.type}`
    };
  };

  const handleMove = (instanceId: string, x: number, y: number) => {
    setDevices(prev => {
      const newDevices = prev.map(device =>
        device.instanceId === instanceId
          ? { ...device, position: { x, y } }
          : device
      );
      return newDevices;
    });
  };

  const handleDelete = (deviceToDelete: string) => {
    const deviceToDeleteObj = devices.find(d => d.instanceId === deviceToDelete);
    if (!deviceToDeleteObj) return;

    // Update appropriate count based on device type
    switch (deviceToDeleteObj.deviceType) {
      case "router":
        setRouterCount(c => c - 1);
        break;
      case "pc":
        setPcCount(c => c - 1);
        break;
      case "switch":
        setSwitchCount(c => c - 1);
        break;
    }

    setDevices(prev => prev.filter(d => d.instanceId !== deviceToDelete));

    return {
      action: `delete_${deviceToDelete}`
    };
  };

  const resetDevices = () => {
    setDevices([]);
    setRouterCount(0);
    setPcCount(0);
    setSwitchCount(0);
  };

  return {
    devices,
    setDevices,
    routerCount,
    setRouterCount,
    pcCount,
    setPcCount,
    switchCount,
    setSwitchCount,
    handleDrop,
    handleMove,
    handleDelete,
    resetDevices
  };
}; 