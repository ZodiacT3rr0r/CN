import { useState, useRef } from 'react';
import { NetworkEvent, LinkState } from '../types';

interface Animation {
  from: string;
  to: string;
  id: number;
  type: "hello" | "dv" | "lsp";
  lspData?: LinkState;
}

export const useNetworkEvents = () => {
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [animations, setAnimations] = useState<Animation[]>([]);
  const sentPackets = useRef(new Set<string>());

  const addNetworkEvent = (event: NetworkEvent) => {
    setNetworkEvents(prev => [...prev, event]);
  };

  const handlePacketSent = (from: string, to: string, id: number) => {
    // Create a unique key for this packet
    const packetKey = `${from}-${to}-${id}`;
    
    // If we've already sent this packet, don't send it again
    if (sentPackets.current.has(packetKey)) {
      return;
    }
    
    // Mark this packet as sent
    sentPackets.current.add(packetKey);
    
    addNetworkEvent({
      type: "packet_sent",
      details: {
        from,
        to,
        packetId: id,
      },
    });
  };

  const handleLinkCreated = (from: string, to: string) => {
    addNetworkEvent({
      type: "link_created",
      details: {
        from,
        to,
      },
    });
  };

  const resetNetworkEvents = () => {
    setNetworkEvents([]);
    setAnimations([]);
    sentPackets.current.clear(); // Clear the sent packets tracking
  };

  return {
    networkEvents,
    animations,
    setAnimations,
    setNetworkEvents,
    addNetworkEvent,
    handlePacketSent,
    handleLinkCreated,
    resetNetworkEvents
  };
}; 