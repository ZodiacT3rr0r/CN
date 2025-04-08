import { useState, useCallback } from 'react';
import { DeviceInstance, Link, LinkState, LinkStateRoutingTable } from '../types';

export function useLinkStateRouting(devices: DeviceInstance[], links: Link[]) {
  const [linkStates, setLinkStates] = useState<{ [key: string]: LinkState }>({});
  const [routingTables, setRoutingTables] = useState<{ [key: string]: LinkStateRoutingTable[] }>({});

  // Build adjacency list from links
  const buildAdjacencyList = useCallback(() => {
    const adjList: { [key: string]: { node: string; cost: number }[] } = {};
    
    // Initialize empty lists for all devices
    devices.forEach(device => {
      adjList[device.instanceId] = [];
    });

    // Add edges from links
    links.forEach(link => {
      adjList[link.from].push({ node: link.to, cost: link.weight });
      adjList[link.to].push({ node: link.from, cost: link.weight });
    });

    return adjList;
  }, [devices, links]);

  // Compute shortest paths using Dijkstra's algorithm
  const computeShortestPaths = useCallback((startNode: string, adjList: { [key: string]: { node: string; cost: number }[] }) => {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string } = {};
    const unvisited = new Set<string>();
    
    // Initialize distances and unvisited set
    devices.forEach(device => {
      distances[device.instanceId] = Infinity;
      previous[device.instanceId] = '';
      unvisited.add(device.instanceId);
    });
    
    distances[startNode] = 0;
    
    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current = '';
      let minDistance = Infinity;
      unvisited.forEach(node => {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      });
      
      if (current === '') break;
      unvisited.delete(current);
      
      // Update distances to neighbors
      adjList[current].forEach(({ node, cost }) => {
        if (unvisited.has(node)) {
          const newDistance = distances[current] + cost;
          if (newDistance < distances[node]) {
            distances[node] = newDistance;
            previous[node] = current;
          }
        }
      });
    }
    
    // Build routing table
    const routingTable: LinkStateRoutingTable[] = [];
    devices.forEach(device => {
      if (device.instanceId !== startNode) {
        const path: string[] = [];
        let current = device.instanceId;
        while (current !== '') {
          path.unshift(current);
          current = previous[current];
        }
        
        routingTable.push({
          destination: device.instanceId,
          nextHop: path[1] || '',
          cost: distances[device.instanceId],
          path
        });
      }
    });
    
    return routingTable;
  }, [devices]);

  // Update link states and routing tables
  const updateLinkStates = useCallback(() => {
    const adjList = buildAdjacencyList();
    const newLinkStates: { [key: string]: LinkState } = {};
    const newRoutingTables: { [key: string]: LinkStateRoutingTable[] } = {};
    
    // Update link states for each router
    devices.forEach(device => {
      if (device.deviceType === 'router') {
        const neighbors: { [key: string]: number } = {};
        adjList[device.instanceId].forEach(({ node, cost }) => {
          neighbors[node] = cost;
        });
        
        newLinkStates[device.instanceId] = {
          nodeId: device.instanceId,
          neighbors,
          sequenceNumber: (linkStates[device.instanceId]?.sequenceNumber || 0) + 1,
          timestamp: Date.now()
        };
        
        // Compute routing table
        newRoutingTables[device.instanceId] = computeShortestPaths(device.instanceId, adjList);
      }
    });
    
    setLinkStates(newLinkStates);
    setRoutingTables(newRoutingTables);
  }, [devices, buildAdjacencyList, computeShortestPaths]);

  // Reset routing state
  const resetRouting = useCallback(() => {
    setLinkStates({});
    setRoutingTables({});
  }, []);

  return {
    linkStates,
    routingTables,
    updateLinkStates,
    resetRouting,
    buildAdjacencyList
  };
} 