import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { EmailService } from '../services/email.service';
import { CreditService } from '../services/credit.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private creditService: CreditService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);

    // Add welcome bonus credits
    try {
      await this.creditService.addWelcomeBonus(savedUser.id);
      console.log(`✅ Added welcome bonus to new user ${savedUser.id}`);
    } catch (error) {
      console.error('Failed to add welcome bonus:', error);
      // Don't fail registration if credit bonus fails
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, firstName);
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send welcome email:', error);
    }

    // Generate JWT token
    const payload = { sub: savedUser.id, email: savedUser.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, rememberMe } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with different expiration based on remember me
    const payload = { sub: user.id, email: user.email };
    const expiresIn = rememberMe ? '30d' : '24h'; // 30 days if remember me, 24 hours otherwise
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Save reset token
    const passwordReset = this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send password reset email
    const emailSent = await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.firstName,
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    // Find valid reset token
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!passwordReset || passwordReset.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await this.userRepository.update(passwordReset.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.passwordResetRepository.update(passwordReset.id, {
      used: true,
    });

    return { message: 'Password has been reset successfully' };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
