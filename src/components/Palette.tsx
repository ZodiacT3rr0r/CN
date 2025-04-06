import React from 'react';
import { Device } from '../types';

interface PaletteProps {
  devices: Device[];
}

function Palette({ devices }: PaletteProps) {
  const handleDragStart = (e: React.DragEvent, device: Device) => {
    e.dataTransfer.setData('deviceId', device.id);
  };

  return (
    <div className="bg-black text-white p-6  shadow-lg w-48 h-screen">
      <h2 className="text-lg font-semibold mb-4">Devices</h2>
      <div className="flex flex-col gap-4">
        {devices.map((device) => (
          <div
            key={device.id}
            draggable
            onDragStart={(e) => handleDragStart(e, device)}
            className={`${device.color} w-16 h-16 rounded flex items-center justify-center cursor-move transition-transform hover:scale-105`}
          >
            <device.icon className="w-8 h-8 text-white" />
          </div>
        ))}
      </div>

      routing table shown below
    </div>
  );
}

export default Palette