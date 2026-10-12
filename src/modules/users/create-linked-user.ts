import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryFailedError } from 'typeorm';
import { Role } from '../../common/types/role';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

const TEMPORARY_LINKED_USER_PASSWORD = 'favl1234';

interface LinkedUserInput {
  role: Role;
  usernamePrefix: 'club' | 'piloto';
  email: string;
  storePlaintextPassword: boolean;
}

export async function createLinkedUser(
  manager: EntityManager,
  input: LinkedUserInput,
): Promise<User> {
  const accountId = randomBytes(16).toString('hex');
  const users = manager.getRepository(User);
  const user = users.create({
    usuario: `${input.usernamePrefix}-${accountId}`,
    email: normalizeEmail(input.email),
    role: input.role,
    passwordHash: await hash(TEMPORARY_LINKED_USER_PASSWORD, 12),
    passTxt: input.storePlaintextPassword ? TEMPORARY_LINKED_USER_PASSWORD : null,
    activo: true,
  });

  try {
    const savedUser = await users.save(user);
    await manager.getRepository(UserProfile).save({ userId: savedUser.id });
    return savedUser;
  } catch (error) {
    throwEmailConflict(error);
    throw error;
  }
}

export async function updateLinkedUserEmail(
  manager: EntityManager,
  userId: number,
  email: string,
): Promise<void> {
  const users = manager.getRepository(User);
  const user = await users.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('No se encontró la cuenta vinculada.');
  const normalizedEmail = normalizeEmail(email);
  if (user.email === normalizedEmail) return;

  try {
    user.email = normalizedEmail;
    await users.save(user);
  } catch (error) {
    throwEmailConflict(error);
    throw error;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function throwEmailConflict(error: unknown): void {
  if (!(error instanceof QueryFailedError)) return;
  const driverError: unknown = error.driverError;
  if (
    typeof driverError === 'object'
    && driverError !== null
    && 'code' in driverError
    && driverError.code === 'ER_DUP_ENTRY'
  ) {
    throw new ConflictException('Ese email ya está asociado a otra cuenta.');
  }
}
