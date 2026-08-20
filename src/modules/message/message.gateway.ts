// message.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway {

  // =========================================
  // WEBSOCKET SERVER
  // =========================================

  @WebSocketServer()
  server!: Server;


  // =========================================
  // GESTION DE LA CONNEXION À UNE ROOM
  // =========================================

  /**
   * Permet à un utilisateur de rejoindre
   * une room WebSocket dédiée.
   *
   * Exemple :
   * userId = 5 → room "user-5"
   */
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {

    // Chaque utilisateur possède sa propre room
    client.join(`user-${userId}`);

    console.log(`User ${userId} joined room`);
  }


  // =========================================
  // ENVOI DU MESSAGE EN TEMPS RÉEL
  // =========================================

  /**
   * Diffuse le message aux deux utilisateurs
   * concernés par la conversation :
   *
   * - le destinataire
   * - l'expéditeur
   */
  sendMessage(message: any) {

    // -----------------------------------------
    // Envoi au destinataire
    // -----------------------------------------

    this.server
      .to(`user-${message.receiverId}`)
      .emit('newMessage', message);


    // -----------------------------------------
    // Envoi à l'expéditeur
    // -----------------------------------------

    this.server
      .to(`user-${message.senderId}`)
      .emit('newMessage', message);
  }
}