import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GeoService } from '../geo/geo.service.js';
import { UserService } from '../user/user.service.js';

interface UserLocationEntry {
  lat: number;
  lng: number;
  updatedAt: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  level: number;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  /** Map of userId to the set of socket IDs currently connected for that user. */
  private userSockets = new Map<string, Set<string>>();

  /** Ephemeral in-memory location store — never persisted to DB. */
  private userLocations = new Map<string, UserLocationEntry>();

  private broadcastInterval: NodeJS.Timeout;
  private readonly BROADCAST_INTERVAL_MS = 5000;
  private readonly NEARBY_RADIUS_KM = 10;
  private readonly STALE_MS = 30_000;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly geoService: GeoService,
    private readonly userService: UserService,
  ) {}

  afterInit() {
    this.broadcastInterval = setInterval(
      () => this.broadcastNearbyUsers(),
      this.BROADCAST_INTERVAL_MS,
    );
  }

  onModuleDestroy() {
    clearInterval(this.broadcastInterval);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId: string = payload.sub;
      client.data.userId = userId;
      client.data.username = payload.username;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data?.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
        this.userLocations.delete(userId);
      }
    }
  }

  /**
   * Emit an event to every socket belonging to a given user.
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Returns true when at least one socket is connected for the user.
   */
  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  @SubscribeMessage('message:typing')
  handleTyping(client: Socket, payload: { recipientId: string }) {
    this.sendToUser(payload.recipientId, 'message:typing', {
      senderId: client.data.userId,
    });
  }

  @SubscribeMessage('location:update')
  async handleLocationUpdate(client: Socket, payload: { lat: number; lng: number }) {
    const userId = client.data.userId;
    if (!userId) return;

    // Validate payload
    if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') return;
    if (payload.lat < -90 || payload.lat > 90 || payload.lng < -180 || payload.lng > 180) return;

    // Round to 3 decimal places (~110m precision) for privacy
    const lat = Math.round(payload.lat * 1000) / 1000;
    const lng = Math.round(payload.lng * 1000) / 1000;

    const existing = this.userLocations.get(userId);
    if (existing) {
      // Update position without re-fetching profile
      existing.lat = lat;
      existing.lng = lng;
      existing.updatedAt = Date.now();
    } else {
      // First update — fetch profile info to cache
      try {
        const user = await this.userService.findById(userId);
        this.userLocations.set(userId, {
          lat,
          lng,
          updatedAt: Date.now(),
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl || '',
          level: user.level ?? 1,
        });
      } catch {
        // User not found — skip
      }
    }
  }

  @SubscribeMessage('location:stop')
  handleLocationStop(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userLocations.delete(userId);
    }
  }

  private broadcastNearbyUsers() {
    const now = Date.now();

    // Prune stale locations
    for (const [uid, loc] of this.userLocations) {
      if (now - loc.updatedAt > this.STALE_MS) {
        this.userLocations.delete(uid);
      }
    }

    const entries = Array.from(this.userLocations.entries());

    for (const [userId, userLoc] of entries) {
      const nearby = entries
        .filter(([otherId, otherLoc]) => {
          if (otherId === userId) return false;
          const dist = this.geoService.haversine(
            userLoc.lat,
            userLoc.lng,
            otherLoc.lat,
            otherLoc.lng,
          );
          return dist <= this.NEARBY_RADIUS_KM;
        })
        .map(([otherId, otherLoc]) => ({
          userId: otherId,
          lat: otherLoc.lat,
          lng: otherLoc.lng,
          username: otherLoc.username,
          displayName: otherLoc.displayName,
          avatarUrl: otherLoc.avatarUrl,
          level: otherLoc.level,
        }));

      this.sendToUser(userId, 'location:nearby', nearby);
    }
  }
}
