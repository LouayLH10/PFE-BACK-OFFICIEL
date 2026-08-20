import { Injectable } from '@nestjs/common';

import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MilestoneService {

  constructor(
    private prisma: PrismaService,
  ) {}


  // =========================================================
  // 1. CREATE MILESTONE
  // =========================================================
  // Crée une étape (milestone) et l'associe à un projet.
  // La date limite est convertie en objet Date avant
  // l'enregistrement dans PostgreSQL.

  async create(dto: CreateMilestoneDto) {

    // Séparer les données de relation et la date
    // du reste des propriétés du DTO
    const {
      projectId,
      deadline,
      ...rest
    } = dto;

    return await this.prisma.milestone.create({

      data: {

        // Données principales du milestone
        ...rest,

        // Utiliser la date fournie ou la date actuelle
        deadline: deadline
          ? new Date(deadline)
          : new Date(),

        // Association du milestone au projet
        project: {
          connect: {
            id: projectId,
          },
        },
      },

      // Retourner également le projet associé
      include: {
        project: true,
      },
    });
  }


  // =========================================================
  // 2. GET ALL MILESTONES
  // =========================================================
  // Récupère l'ensemble des milestones.
  // Les résultats sont triés du plus récent au plus ancien.

  async findAll() {

    return await this.prisma.milestone.findMany({

      // Inclure les informations du projet associé
      include: {
        project: true,
      },

      // Trier par identifiant décroissant
      orderBy: {
        id: 'desc',
      },
    });
  }


  // =========================================================
  // 3. GET MILESTONE BY ID
  // =========================================================
  // Recherche un milestone à partir de son identifiant
  // et retourne également son projet associé.

  async findOne(id: number) {

    return await this.prisma.milestone.findUnique({

      where: {
        id,
      },

      include: {
        project: true,
      },
    });
  }


  // =========================================================
  // 4. UPDATE MILESTONE
  // =========================================================
  // Modifie les informations d'un milestone.
  // La relation avec le projet et la date limite peuvent
  // également être modifiées.

  async update(
    id: number,
    dto: UpdateMilestoneDto,
  ) {

    // Séparer les propriétés spécifiques
    // du reste des données à mettre à jour
    const {
      projectId,
      deadline,
      ...rest
    } = dto;

    return await this.prisma.milestone.update({

      where: {
        id,
      },

      data: {

        // Mise à jour des propriétés principales
        ...rest,

        // Modifier la date uniquement si elle est fournie
        ...(deadline && {
          deadline: new Date(deadline),
        }),

        // Modifier le projet associé uniquement
        // si un nouveau projectId est fourni
        ...(projectId && {
          project: {
            connect: {
              id: projectId,
            },
          },
        }),
      },

      include: {
        project: true,
      },
    });
  }


  // =========================================================
  // 5. DELETE MILESTONE
  // =========================================================
  // Supprime définitivement un milestone de la base de données.

  async remove(id: number) {

    return await this.prisma.milestone.delete({

      where: {
        id,
      },
    });
  }


  // =========================================================
  // 6. GET MILESTONES BY PROJECT
  // =========================================================
  // Récupère uniquement les milestones appartenant
  // à un projet donné.
  //
  // Les résultats sont triés chronologiquement
  // selon leur date limite.

  async findByProject(projectId: number) {

    return await this.prisma.milestone.findMany({

      where: {
        projectId,
      },

      orderBy: {
        deadline: 'asc',
      },
    });
  }

}