import fetch from 'node-fetch';

export class AdaxApi {
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(private clientId: string, private secret: string) {}

  // Håndterer login og token refresh
  private async authenticate(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return;
    }

    const res = await fetch('https://api-1.adax.no/client-api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=password&username=${this.clientId}&password=${this.secret}`,
    });

    if (!res.ok) {
      throw new Error(`Auth failed: ${res.statusText}`);
    }
    const data: any = await res.json(); // 👈 rettet fra "unknown" til "any"

    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  // Generisk request-metode
  private async request(endpoint: string): Promise<any> {
    await this.authenticate();
    const res = await fetch(`https://api-1.adax.no/client-api/rest/v1/${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      throw new Error(`ADAX API error: ${res.statusText}`);
    }
    return res.json();
  }

  // Henter rum + energidata
  async getRoomsWithEnergy(): Promise<any> {
    return this.request('content/?withEnergy=1');
  }

  // Henter energilog for specifikt rum
  async getRoomEnergyLog(roomId: number): Promise<any> {
    return this.request(`energy_log/${roomId}`);
  }

  // Sætter temperatur på et rum
  async setRoomTemperature(roomId: number, temperature: number): Promise<void> {
    await this.authenticate();
    await fetch('https://api-1.adax.no/client-api/rest/v1/control/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        rooms: [{ id: roomId, targetTemperature: temperature }],
      }),
    });
  }
}
