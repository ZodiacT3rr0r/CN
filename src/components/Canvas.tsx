// components/Canvas.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Device, DeviceInstance, Link } from '../types';
import { Mail } from 'lucide-react';

interface CanvasProps {
  devices: DeviceInstance[];
  availableDevices: Device[];
  links: Link[];
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  selected: string | null;
  setSelected: React.Dispatch<React.SetStateAction<string | null>>;
  onDrop: (device: Device, x: number, y: number) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  animations: { from: string; to: string; id: number }[];
  setAnimations: React.Dispatch<React.SetStateAction<{ from: string; to: string; id: number }[]>>;
}

function Canvas({
  devices,
  availableDevices,
  links,
  setLinks,
  selected,
  setSelected,
  onDrop,
  onMove,
  animations,
  setAnimations,
}: CanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wasDraggingRef = useRef(false);
  const [animatedPackets, setAnimatedPackets] = useState<any[]>([]);

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

  const handleMouseDown = (e: React.MouseEvent, instanceId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingId(instanceId);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    wasDraggingRef.current = true;
    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - canvasRect.left - offset.x + 32;
    const y = e.clientY - canvasRect.top - offset.y + 32;
    onMove(draggingId, x, y);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setTimeout(() => (wasDraggingRef.current = false), 0);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'canvas') {
      setSelected(null);
    }
  };

  const handleDeviceClick = (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wasDraggingRef.current) return;

    if (selected && selected !== instanceId) {
      const existingLinkIndex = links.findIndex(
        (link) =>
          (link.from === selected && link.to === instanceId) ||
          (link.from === instanceId && link.to === selected)
      );

      if (existingLinkIndex !== -1) {
        const newLinks = [...links];
        newLinks.splice(existingLinkIndex, 1);
        setLinks(newLinks);
      } else {
        setLinks([...links, { from: selected, to: instanceId }]);
      }

      setSelected(null);
    } else {
      setSelected(instanceId);
    }
  };

  // Animate hello packet movement
  useEffect(() => {
    if (animations.length === 0) return;

    const packets = animations.map(({ from, to, id }) => {
      const fromDevice = devices.find((d) => d.instanceId === from);
      const toDevice = devices.find((d) => d.instanceId === to);
      if (!fromDevice || !toDevice) return null;

      return {
        id,
        from,
        to,
        start: fromDevice.position,
        end: toDevice.position,
        progress: 0,
      };
    }).filter(Boolean);

    setAnimatedPackets(packets);

    const interval = setInterval(() => {
      setAnimatedPackets((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            progress: p.progress + 0.01, // adjust this for smoother/slower
          }))
          .filter((p) => p.progress <= 1); // ensure packet fully reaches
    
        if (next.length === 0) {
          clearInterval(interval);
          setAnimations([]); // signal App to continue to next wave
        }
    
        return next;
      });
    }, 20); // slower interval = smoother animation
    

    return () => clearInterval(interval);
  }, [animations]);

  return (
    <div
      id="canvas"
      className="bg-black rounded-lg shadow-lg flex-1 h-[600px] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* SVG for links and animated hello packets */}
      <svg className="absolute w-full h-full pointer-events-none">
        {/* Render static links */}
        {links.map((link, index) => {
          const from = devices.find((d) => d.instanceId === link.from);
          const to = devices.find((d) => d.instanceId === link.to);
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

        {/* Marker for arrows */}
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

        {/* Render animated packets */}
        {animatedPackets.map((packet) => {
          const { start, end, progress, id } = packet;
          const cx = start.x + (end.x - start.x) * progress;
          const cy = start.y + (end.y - start.y) * progress;

          return (
            <foreignObject
              key={`packet-${id}`}
              x={cx - 8}
              y={cy - 8}
              width={32}
              height={32}
              style={{ opacity: 1 }}
            >
              <Mail className="text-white w-8 h-8" />
            </foreignObject>
          );
        })}
      </svg>

      {/* Device nodes */}
      {devices.map((device) => {
        const isSelected = selected === device.instanceId;
        return (
          <div
            key={device.instanceId}
            className={`
              absolute 
              ${device.color} 
              w-16 h-16 
              rounded-full 
              flex flex-col items-center justify-center 
              cursor-move 
              border-2 
              ${isSelected ? 'border-purple-500' : 'border-white'}
            `}
            style={{
              left: device.position.x - 32,
              top: device.position.y - 32,
            }}
            onMouseDown={(e) => handleMouseDown(e, device.instanceId)}
            onClick={(e) => handleDeviceClick(device.instanceId, e)}
          >
            {React.createElement(device.icon, {
              className: `w-8 h-8 z-40 ${isSelected ? 'text-white' : 'text-black'}`,
            })}
            <span className="text-white text-xs mt-1">{device.instanceId}</span>
          </div>
        );
      })}
    </div>
  );
}

export default Canvas;
