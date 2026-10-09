import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../services/authService.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { TripMessage } from '../models/TripMessage.js';
import { User } from '../models/User.js';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance = io;

  // Optional authentication middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token || (socket.handshake.query?.token as string | undefined);
    if (token) {
      try {
        const userId = verifyAccessToken(token);
        socket.data.userId = userId;
      } catch (err) {
        logger.warn({ err }, 'Socket connection with invalid token provided');
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    logger.debug({ socketId: socket.id, userId }, 'Socket client connected');

    // Join group trip room
    socket.on('join:trip', async ({ tripId }: { tripId: string }) => {
      if (!tripId) return;
      try {
        if (!userId) {
          socket.emit('error', { message: 'Authentication required to join trip room.' });
          return;
        }

        const trip = await Trip.findById(tripId);
        if (!trip) {
          socket.emit('error', { message: 'Trip not found.' });
          return;
        }

        const isOwner = trip.owner.toString() === userId;
        const isMember = await TripMember.exists({
          trip: trip._id,
          user: userId,
          status: 'active',
        });

        if (!isOwner && !isMember) {
          socket.emit('error', { message: 'Not authorized for this trip room.' });
          return;
        }

        const room = `trip:${tripId}`;
        await socket.join(room);
        logger.debug({ userId, tripId, room }, 'Socket joined trip room');
        socket.emit('joined:trip', { tripId });
      } catch (err) {
        logger.error({ err, tripId }, 'Error joining trip room');
      }
    });

    // Leave group trip room
    socket.on('leave:trip', ({ tripId }: { tripId: string }) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    // Send group chat message via socket
    socket.on(
      'chat:send',
      async (data: {
        tripId: string;
        content: string;
        type?: 'chat' | 'announcement' | 'alert';
        pinned?: boolean;
      }) => {
        try {
          if (!userId) {
            socket.emit('error', { message: 'Authentication required to send messages.' });
            return;
          }

          const { tripId, content, type = 'chat', pinned = false } = data;
          if (!tripId || !content || !content.trim()) return;

          const trip = await Trip.findById(tripId);
          if (!trip) return;

          const isOwner = trip.owner.toString() === userId;
          const isMember = await TripMember.exists({
            trip: trip._id,
            user: userId,
            status: 'active',
          });

          if (!isOwner && !isMember) {
            socket.emit('error', { message: 'Not authorized to send messages in this trip.' });
            return;
          }

          const user = await User.findById(userId).select('name');
          const senderName = user?.name || 'Traveler';

          const messageDoc = await TripMessage.create({
            trip: trip._id,
            sender: userId,
            senderName,
            type,
            content: content.trim(),
            pinned: isOwner ? Boolean(pinned) : false,
          });

          io.to(`trip:${tripId}`).emit('chat:message', {
            _id: messageDoc._id.toString(),
            tripId,
            senderId: userId,
            senderName,
            type: messageDoc.type,
            content: messageDoc.content,
            pinned: messageDoc.pinned,
            createdAt: messageDoc.createdAt,
          });
        } catch (err) {
          logger.error({ err }, 'Error sending chat message via socket');
        }
      },
    );

    // Live member location sharing within group trip
    socket.on(
      'member:location',
      async (data: { tripId: string; latitude: number; longitude: number }) => {
        if (!userId || !data.tripId) return;
        try {
          const user = await User.findById(userId).select('name');
          const senderName = user?.name || 'Traveler';

          socket.to(`trip:${data.tripId}`).emit('member:location_update', {
            userId,
            userName: senderName,
            latitude: data.latitude,
            longitude: data.longitude,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          logger.error({ err }, 'Error broadcasting member location');
        }
      },
    );

    // Join emergency location share room (public token for trusted contacts)
    socket.on('join:emergency', ({ shareToken }: { shareToken: string }) => {
      if (shareToken) {
        socket.join(`emergency:${shareToken}`);
        logger.debug({ shareToken }, 'Socket joined emergency share room');
      }
    });

    // Push live coordinates to emergency room
    socket.on(
      'emergency:push_location',
      (data: {
        shareToken: string;
        latitude: number;
        longitude: number;
        accuracyMeters?: number;
      }) => {
        if (!data.shareToken) return;
        io.to(`emergency:${data.shareToken}`).emit('emergency:location_update', {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: data.accuracyMeters,
          timestamp: new Date().toISOString(),
        });
      },
    );

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket client disconnected');
    });
  });

  return io;
}
