import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // ============================================================
  // 1. INJECTION DES SERVICES
  // ============================================================
  // PrismaService : accès à la base de données PostgreSQL
  // JwtService    : génération des tokens JWT
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ============================================================
  // 2. INSCRIPTION D'UN UTILISATEUR
  // ============================================================
  // Vérifie l'unicité de l'email, chiffre le mot de passe
  // puis crée le compte utilisateur.
  async register(dto: RegisterDto) {
    // 2.1 Vérification de l'existence du compte
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // 2.2 Chiffrement du mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 2.3 Création de l'utilisateur dans PostgreSQL
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    // 2.4 Retour du résultat de l'inscription
    return {
      message: 'User created successfully',
      userId: user.id,
    };
  }

  // ============================================================
  // 3. AUTHENTIFICATION DE L'UTILISATEUR
  // ============================================================
  // Vérifie les identifiants puis génère un token JWT
  // permettant d'authentifier les requêtes suivantes.
  async login(dto: LoginDto) {
    // 3.1 Recherche de l'utilisateur par email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3.2 Vérification du mot de passe
    const isMatch = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ============================================================
    // 4. GÉNÉRATION DU TOKEN JWT
    // ============================================================
    // Le payload contient les informations nécessaires
    // pour identifier l'utilisateur lors des requêtes protégées.
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    // 4.1 Retour du token d'authentification
    return {
      access_token: accessToken,
    };
  }
}