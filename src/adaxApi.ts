import fetch from 'node-fetch';

interface AdaxAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface AdaxRoom {
  id: number;
  name: string;
  temperature?: number;
  targetTemperature?: number;
  energyUsage?: number;
}

export interface AdaxContentResponse {
  rooms: AdaxRoom[];
  devices?: {
    id: number;
    name: string;
    energyWh: number;
    energyTime: number;
  }[];
}

export interface AdaxEnergyLogPoint {
  fromTime: number;
  toTime: number;
  energyWh: number;
}

export class AdaxApi {
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(private clientId: string, private secret: string) {}

  private async authenticate(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return;

    const res = await fetch('https://api-1.adax.no/client-api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=password&username=${this.clientId}&password=${this.secret}`,
    });

    if (!res.ok) throw new Error(`Auth failed: ${res.statusText}`);

    const data: AdaxAuthResponse = await res.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  private async request<T>(endpoint: string): Promise<T> {
    await this.authenticate();
    const res = await fetch(`https://api-1.adax.no/client-api/rest/v1/${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`ADAX API error: ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async getRoomsWithEnergy(): Promise<AdaxContentResponse> {
    return this.request<AdaxContentResponse>('content/?withEnergy=1');
  }

  async getRoomEnergyLog(roomId: number): Promise<AdaxEnergyLogPoint[]> {
    return this.request<AdaxEnergyLogPoint[]>(`energy_log/${roomId}`);
  }

  async setRoomTemperature(roomId: number, temperature: number): Promise<void> {
    await this.authenticate();
    const res = await fetch('https://api-1.adax.no/client-api/rest/v1/control/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        rooms: [{ id: roomId, targetTemperature: temperature }],
      }),
    });
    if (!res.ok) throw new Error(`Failed to set temperature: ${res.statusText}`);
  }
}