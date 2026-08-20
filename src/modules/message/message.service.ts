import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { MessageGateway } from './message.gateway';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private gateway: MessageGateway,
  ) {}

  // =========================================================
  // 1. CREATE MESSAGE
  // =========================================================
  // Crée un nouveau message entre deux utilisateurs.
  // Le message peut contenir du texte, un fichier, ou les deux.
  // Après l'enregistrement, le message est envoyé en temps réel
  // via WebSocket grâce au MessageGateway.

  async create(dto: CreateMessageDto, file?: any) {
    // Vérifier qu'un contenu ou un fichier est présent
    if (!dto.content && !file) {
      throw new BadRequestException(
        'Message content or file is required',
      );
    }

    // Enregistrer le message dans la base de données
    const message = await this.prisma.message.create({
      data: {
        content: dto.content ?? null,

        fileUrl: file?.filename
          ? `/uploads/${file.filename}`
          : null,

        sender: {
          connect: {
            id: Number(dto.senderId),
          },
        },

        receiver: {
          connect: {
            id: Number(dto.receiverId),
          },
        },

        sentDate: new Date(),
      },

      include: {
        sender: true,
        receiver: true,
      },
    });

    // Envoyer le message en temps réel aux clients connectés
    this.gateway.sendMessage(message);

    return message;
  }

  // =========================================================
  // 2. GET ALL MESSAGES
  // =========================================================
  // Récupère tous les messages enregistrés dans la base de données.
  // Les informations de l'expéditeur et du destinataire sont incluses.

  async findAll() {
    return await this.prisma.message.findMany({
      include: {
        sender: true,
        receiver: true,
      },

      orderBy: {
        sentDate: 'desc',
      },
    });
  }

  // =========================================================
  // 3. GET MESSAGE BY ID
  // =========================================================
  // Recherche un message à partir de son identifiant.
  // Une exception est retournée si le message n'existe pas.

  async findOne(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },

      include: {
        sender: true,
        receiver: true,
      },
    });

    // Vérifier l'existence du message
    if (!message) {
      throw new NotFoundException(
        `Message #${id} not found`,
      );
    }

    return message;
  }

  // =========================================================
  // 4. UPDATE MESSAGE
  // =========================================================
  // Modifie le contenu d'un message existant.

  async update(
    id: number,
    dto: UpdateMessageDto,
  ) {
    return await this.prisma.message.update({
      where: { id },

      data: {
        content: dto.content,
      },

      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  // =========================================================
  // 5. DELETE MESSAGE
  // =========================================================
  // Supprime définitivement un message de la base de données.

  async remove(id: number) {
    return await this.prisma.message.delete({
      where: { id },
    });
  }

  // =========================================================
  // 6. GET CONVERSATION BETWEEN TWO USERS
  // =========================================================
  // Récupère tous les messages échangés entre deux utilisateurs,
  // quel que soit le sens de la communication.
  //
  // Exemple :
  // User A → User B
  // User B → User A

  async getConversation(
    user1Id: number,
    user2Id: number,
  ) {
    const conversation =
      await this.prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: user1Id,
              receiverId: user2Id,
            },

            {
              senderId: user2Id,
              receiverId: user1Id,
            },
          ],
        },

        orderBy: {
          sentDate: 'asc',
        },

        include: {
          sender: true,
          receiver: true,
        },
      });

    // Si aucune conversation n'existe encore
    if (conversation.length === 0) {
      return {
        message: 'You can start your conversation',
        data: [],
      };
    }

    return conversation;
  }
}