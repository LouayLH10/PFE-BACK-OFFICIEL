import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  // ============================================================
  // 1. IMPORTATION DES MODULES ET DÉPENDANCES
  // ============================================================
  // PrismaModule : permet à AuthService d'accéder à PostgreSQL.
  //
  // JwtModule : fournit les fonctionnalités nécessaires
  // à la génération et à la vérification des tokens JWT.
  imports: [
    PrismaModule,

    // ==========================================================
    // 2. CONFIGURATION DE JWT
    // ==========================================================
    // Définition de la clé secrète utilisée pour signer les tokens
    // et de leur durée de validité.
    JwtModule.register({
      secret: 'SECRET_KEY',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],

  // ============================================================
  // 3. CONTRÔLEUR
  // ============================================================
  // AuthController expose les endpoints d'authentification
  // tels que /auth/register et /auth/login.
  controllers: [
    AuthController,
  ],

  // ============================================================
  // 4. SERVICES ET STRATÉGIES
  // ============================================================
  // AuthService : contient la logique métier de l'authentification.
  //
  // JwtStrategy : permet de valider les tokens JWT reçus
  // lors de l'accès aux routes protégées.
  providers: [
    AuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}