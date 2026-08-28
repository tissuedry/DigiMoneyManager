import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-digi-money-manager-12345';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JWTPayload {
  id: number;
  nama: string;
  email: string;
  role: string;
  roles?: string[];
  proyekId?: number | null;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export interface ResolvedRoles {
  primaryRole: string;
  allowedRoles: string[];
  activeProyekId: number | null;
}

export function resolveUserRoles(
  userRole: string | null | undefined,
  userProyeks: Array<{ role?: string; proyekId?: number }> = [],
  requestedProyekId?: number | null
): ResolvedRoles {
  const rolesSet = new Set<string>();
  const safeRole = (userRole || '').trim();
  const dbRoleLower = safeRole.toLowerCase();

  let primaryRole = safeRole;
  let activeProyekId: number | null = requestedProyekId !== undefined ? requestedProyekId : (userProyeks.length > 0 ? (userProyeks[0].proyekId ?? null) : null);

  const isSuperAdmin = dbRoleLower === 'superadmin' || dbRoleLower === 'super admin';

  if (
    dbRoleLower === 'direktur / manajemen' ||
    dbRoleLower === 'tim keuangan' ||
    isSuperAdmin
  ) {
    if (isSuperAdmin) {
      primaryRole = 'Superadmin';
      rolesSet.add('Superadmin');
    } else {
      rolesSet.add(safeRole);
    }
  } else {
    const hasPM = userProyeks.some((up: any) => up.role === 'Project Manager');
    const hasKaryawan = userProyeks.some((up: any) => up.role === 'Anggota Lapangan') || !hasPM;

    if (hasPM) rolesSet.add('Project Manager');
    if (hasKaryawan) rolesSet.add('Karyawan');

    if (requestedProyekId !== undefined && requestedProyekId !== null) {
      const activeAssignment = userProyeks.find((up: any) => up.proyekId === requestedProyekId);
      if (activeAssignment) {
        primaryRole = activeAssignment.role === 'Anggota Lapangan' ? 'Karyawan' : 'Project Manager';
        activeProyekId = requestedProyekId;
      } else {
        activeProyekId = null;
        primaryRole = hasPM ? 'Project Manager' : 'Karyawan';
      }
    } else {
      primaryRole = hasPM ? 'Project Manager' : 'Karyawan';
    }
  }

  return {
    primaryRole,
    allowedRoles: Array.from(rolesSet),
    activeProyekId,
  };
}
