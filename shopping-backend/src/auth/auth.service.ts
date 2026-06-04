
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
   
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      
      throw new ConflictException('Użytkownik z takim adresem email już istnieje');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(email, hashed);
    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Nieprawidłowy email lub hasło');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Nieprawidłowy email lub hasło');

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    return {
      access_token: this.jwtService.sign({ sub: user.id }),
    };
  }
}