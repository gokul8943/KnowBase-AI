import type { Request, Response, NextFunction } from 'express';
import { organizationRepository } from './organization.repository';
import { AuthorizationError, NotFoundError } from '../../shared/errors/AppError';
import type { MemberRole } from '@prisma/client';

declare module 'express' {
  interface Request {
    organization?: {
      id: string;
      name: string;
      slug: string;
    };
    organizationMember?: {
      id: string;
      role: MemberRole;
      userId: string;
      organizationId: string;
    };
  }
}

export const requireOrganizationMember = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.params.organizationId;
    if (!organizationId) {
      throw new AuthorizationError('Organization ID is required');
    }

    const userId = req.user!.id;

    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member) {
      throw new AuthorizationError('You are not a member of this organization');
    }

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization');
    }

    req.organization = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    };

    req.organizationMember = {
      id: member.id,
      role: member.role,
      userId: member.userId,
      organizationId: member.organizationId,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export const requireOrganizationRole = (...allowedRoles: MemberRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.organizationMember) {
        throw new AuthorizationError('Organization membership not verified');
      }

      if (!allowedRoles.includes(req.organizationMember.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const requireOwner = requireOrganizationRole('OWNER');
export const requireAdminOrOwner = requireOrganizationRole('OWNER', 'ADMIN');
export const requireMemberOrAbove = requireOrganizationRole('OWNER', 'ADMIN', 'MEMBER');