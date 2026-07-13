import type { DeviceHandler } from './types';
import { MikrotikHotspot } from './mikrotik-hotspot';
// import { MikrotikPppoe } from './mikrotik-pppoe';

export function getDeviceHandler(type: string): DeviceHandler {
  switch (type) {
    case 'hotspot':
      return new MikrotikHotspot();
    case 'pppoe':
      throw new Error('PPPoE device handler not yet implemented');
    default:
      throw new Error(`Unknown device type: ${type}`);
  }
}
