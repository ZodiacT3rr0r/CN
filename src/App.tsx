import { useState } from 'react';
import { Router, MonitorSmartphone, HardDrive } from 'lucide-react';
import { Device, DeviceInstance, Link } from './types';
import Canvas from './components/Canvas';
import Palette from './components/Palette';

function App() {
  const [devices, setDevices] = useState<DeviceInstance[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const availableDevices: Device[] = [
    { id: 'router', icon: Router, color: 'bg-blue-500', type: 'router' },
    { id: 'pc', icon: MonitorSmartphone, color: 'bg-green-500', type: 'pc' },
    { id: 'switch', icon: HardDrive, color: 'bg-purple-500', type: 'switch' },
  ];

  const handleDrop = (device: Device, x: number, y: number) => {
    const newDevice: DeviceInstance = {
      ...device,
      instanceId: `${device.id}-${Date.now()}`,
      position: { x, y },
    };
    setDevices([...devices, newDevice]);
  };

  const handleMove = (instanceId: string, x: number, y: number) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.instanceId === instanceId ? { ...device, position: { x, y } } : device
      )
    );
  };

  const handleDeviceClick = (instanceId: string) => {
    if (selected && selected !== instanceId) {
      setLinks([...links, { from: selected, to: instanceId }]);
      setSelected(null);
    } else {
      setSelected(instanceId);
    }
  };

  return (
    <div className="flex min-h-screen bg-pattern">
      <Palette devices={availableDevices} />

      <div className="flex flex-col w-full p-8 mx-auto">
        {/* <div className="text-white flex items-center justify-center h-16 gap-4">
          <button className="px-4 py-1 bg-slate-800 rounded">Start</button>
          <button className="px-4 py-1 bg-slate-800 rounded">Select Sender</button>
          <button className="px-4 py-1 bg-slate-800 rounded">Select Receiver</button>
        </div> */}
        <Canvas
          devices={devices}
          availableDevices={availableDevices}
          links={links}
          onDrop={handleDrop}
          onMove={handleMove}
          onDeviceClick={handleDeviceClick}
        />
      </div>
    </div>
  );
}

export default App;
