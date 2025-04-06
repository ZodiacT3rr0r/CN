import React, { useState } from 'react';
import { Device, DeviceInstance, Link } from '../types';

interface CanvasProps {
  devices: DeviceInstance[];
  availableDevices: Device[];
  links: Link[];
  onDrop: (device: Device, x: number, y: number) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  onDeviceClick: (instanceId: string) => void;
}

function Canvas({
  devices,
  availableDevices,
  links,
  onDrop,
  onMove,
  onDeviceClick,
}: CanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const deviceId = e.dataTransfer.getData('deviceId');
    const device = availableDevices.find((s) => s.id === deviceId);
    if (!device) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onDrop(device, x, y);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    instanceId: string
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingId(instanceId);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - canvasRect.left - offset.x + 32;
    const y = e.clientY - canvasRect.top - offset.y + 32;
    onMove(draggingId, x, y);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      className="bg-black rounded-lg shadow-lg flex-1 h-[600px] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* SVG lines for links */}
      <svg className="absolute w-full h-full pointer-events-none">
        {links.map((link, index) => {
          const from = devices.find(d => d.instanceId === link.from);
          const to = devices.find(d => d.instanceId === link.to);
          if (!from || !to) return null;

          return (
            <line
              key={index}
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
              stroke="#00f0ff"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#00f0ff" />
          </marker>
        </defs>
      </svg>

      {/* Device icons */}
      {devices.map((device) => (
        <div
          key={device.instanceId}
          className={`absolute ${device.color} w-16 h-16 rounded-full flex items-center justify-center cursor-move border-2 border-white`}
          style={{
            left: device.position.x - 32,
            top: device.position.y - 32,
          }}
          onMouseDown={(e) => handleMouseDown(e, device.instanceId)}
          onClick={() => onDeviceClick(device.instanceId)}
        >
          {React.createElement(device.icon, { className: 'w-8 h-8 text-black z-40' })}
        </div>
      ))}
    </div>
  );
}

export default Canvas;
