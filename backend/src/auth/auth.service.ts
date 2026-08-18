import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { QuestService } from '../quest/quest.service.js';
import { AchievementService } from '../achievement/achievement.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface UserPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  questsCompleted: number;
  isOnline: boolean;
  hasDragon: boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPayload;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly questService: QuestService,
    private readonly achievementService: AchievementService,
  ) {}

  private async createOnboardingQuests(
    userId: string,
    username: string,
  ): Promise<void> {
    const BERLIN_LAT = 52.52;
    const BERLIN_LNG = 13.405;
    const questGiver = { name: username };

    const onboardingQuests = [
      {
        title: 'Erstelle deine erste SideQuest',
        description:
          'Werde selbst zum Quest-Geber! Erstelle eine eigene Quest und teile sie mit der Community.',
        category: 'skill',
        difficulty: 'easy',
        goalType: 'manual',
        lat: BERLIN_LAT,
        lng: BERLIN_LNG,
        address: 'Berlin, Deutschland',
        questGiver,
      },
      {
        title: 'Mach 10 Kniebeugen!',
        description:
          'Steh auf und mach 10 saubere Kniebeugen. Du schaffst das!',
        category: 'sport',
        difficulty: 'easy',
        goalType: 'count',
        goalCount: 10,
        lat: BERLIN_LAT,
        lng: BERLIN_LNG,
        address: 'Berlin, Deutschland',
        questGiver,
      },
      {
        title: 'Erkunde die Karte',
        description:
          'Geh raus und entdecke deine Umgebung. Lauf eine neue Strecke oder erkunde einen Ort, den du noch nicht kennst.',
        category: 'adventure',
        difficulty: 'easy',
        goalType: 'manual',
        lat: BERLIN_LAT,
        lng: BERLIN_LNG,
        address: 'Berlin, Deutschland',
        questGiver,
      },
      {
        title: 'Sende jemandem eine Nachricht',
        description:
          'Knüpfe neue Verbindungen! Schreibe einer anderen SideQuest-Person eine freundliche Nachricht.',
        category: 'social',
        difficulty: 'easy',
        goalType: 'manual',
        lat: BERLIN_LAT,
        lng: BERLIN_LNG,
        address: 'Berlin, Deutschland',
        questGiver,
      },
    ];

    // Fire-and-forget: never throw, never block the register response
    await Promise.allSettled(
      onboardingQuests.map((q) => this.questService.create(q as any)),
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingByEmail = await this.userService.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingByUsername = await this.userService.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });

    // Create onboarding quests (non-blocking, best-effort)
    void this.createOnboardingQuests(user._id.toString(), user.username);

    // Every account starts with the Neustarter emblem, so a fresh profile
    // already has something on the shelf. Best-effort: badge art generation
    // must never make registration fail.
    void this.achievementService
      .awardStarter(user._id.toString())
      .catch(() => undefined);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; user: UserPayload }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'sidequest-dev-secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const accessToken = this.generateAccessToken(
        payload.sub,
        payload.username,
      );

      const user = await this.userService.findById(payload.sub);

      return {
        accessToken,
        user: this.toUserPayload(user),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: any): AuthResponse {
    const userId = user._id.toString();
    const accessToken = this.generateAccessToken(userId, user.username);
    const refreshToken = this.generateRefreshToken(userId, user.username);

    return {
      accessToken,
      refreshToken,
      user: this.toUserPayload(user),
    };
  }

  private toUserPayload(user: any): UserPayload {
    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || '',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      level: user.level ?? 1,
      questsCompleted: user.questsCompleted ?? 0,
      isOnline: user.isOnline ?? false,
      hasDragon: user.hasDragon ?? false,
    };
  }

  private generateAccessToken(userId: string, username: string): string {
    return this.jwtService.sign(
      { sub: userId, username },
      { expiresIn: '15m' },
    );
  }

  private generateRefreshToken(userId: string, username: string): string {
    return this.jwtService.sign(
      { sub: userId, username, type: 'refresh' },
      {
        secret: process.env.JWT_SECRET || 'sidequest-dev-secret',
        expiresIn: '7d',
      },
    );
  }
}
