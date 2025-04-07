// Palette.tsx
import React from 'react';
import { Device, DeviceInstance, RoutingTable } from '../types';

interface PaletteProps {
  devices: Device[];
  routingTables: Record<string, RoutingTable>;
  devicesOnCanvas: DeviceInstance[];
}

function Palette({ devices, routingTables, devicesOnCanvas }: PaletteProps) {
  const handleDragStart = (e: React.DragEvent, device: Device) => {
    e.dataTransfer.setData('deviceId', device.id);
  };

  return (
    <div className="bg-black text-white p-6 shadow-lg w-[250px] h-screen overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Devices</h2>
      <div className="flex flex-col gap-4 mb-8">
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

      <h2 className="text-lg font-semibold mb-2">Routing Tables</h2>
      <div className="space-y-4">
        {devicesOnCanvas.map((device) => (
          <div key={device.instanceId} className="text-sm">
            <div className="font-bold text-blue-400 mb-1">{device.instanceId}</div>
            {routingTables[device.instanceId] ? (
              <table className="text-md w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="border border-white px-1">Dest</th>
                    <th className="border border-white px-1">Next Hop</th>
                    <th className="border border-white px-1">Hops</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(routingTables[device.instanceId]).map(([dest, info]) => (
                    <tr key={dest}>
                      <td className="border border-white px-1 text-center">{dest}</td>
                      <td className="border border-white px-1 text-center">{info.nextHop}</td>
                      <td className="border border-white px-1 text-center">{info.hops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400">No routes</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Palette;
