import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map(url => url.trim()),
    credentials: true,
  },
  namespace: '/ws',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as any).token ||
        (client.handshake.query as any).token;
      const payload = this.jwtService.verify(token);
      const userId = payload.userId;

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
      this.logger.log(`User ${userId} connected: ${client.id}`);
    } catch (error) {
      this.logger.warn(`Unauthorized WS connection: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  emitNewMessage(recipientId: string, message: any) {
    this.emitToUser(recipientId, 'new_message', { message });
  }

  emitNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'new_notification', { notification });
  }

  emitAppointmentUpdate(userId: string, appointment: any) {
    this.emitToUser(userId, 'appointment_updated', { appointment });
  }
}
