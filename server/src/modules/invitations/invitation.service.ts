import crypto from 'crypto';
import { config } from '../../config';
import { prisma } from '../../config/prisma';
import { invitationRepository } from './invitation.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { Invitation, MemberRole } from '@prisma/client';
import type { CreateInvitationInput, AcceptInvitationInput, InvitationResponse, InvitationWithToken } from './invitation.types';
import { NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../../shared/errors/AppError';
import { INVITATION_EXPIRY_HOURS, INVITATION_TOKEN_LENGTH } from './invitation.types';

interface InvitedByUser {
  id: string;
  name: string;
  email: string;
}

interface InvitationWithInvitedBy extends Invitation {
  invitedBy: InvitedByUser;
}

interface InvitationWithDetails extends Invitation {
  organization: { id: string; name: string; slug: string };
  invitedBy: InvitedByUser;
}

export const invitationService = {
  generateToken(): string {
    return crypto.randomBytes(INVITATION_TOKEN_LENGTH).toString('hex');
  },

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  calculateExpiry(): Date {
    return new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
  },

  async createInvitation(
    organizationId: string,
    userId: string,
    input: CreateInvitationInput
  ): Promise<InvitationWithToken> {
    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new AuthorizationError('Only owners and admins can invite members');
    }

    if (input.role === 'OWNER') {
      throw new ValidationError('Cannot invite as OWNER');
    }

    const existingInvitation = await invitationRepository.findActiveByOrganizationAndEmail(organizationId, input.email);
    if (existingInvitation) {
      throw new ConflictError('An active invitation already exists for this email');
    }

    const existingMember = await organizationRepository.isMember(organizationId, input.email.toLowerCase());
    if (existingMember) {
      throw new ConflictError('This user is already a member of the organization');
    }

    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = this.calculateExpiry();

    const invitation = await invitationRepository.create({
      ...input,
      organizationId,
      tokenHash,
      invitedById: userId,
      expiresAt,
    });

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization');
    }

    const acceptUrl = `${config.clientUrl}/invitations/accept?token=${token}`;

    return this.mapToResponseWithToken(invitation, token, acceptUrl);
  },

  async listInvitations(organizationId: string, userId: string): Promise<InvitationResponse[]> {
    await organizationRepository.isMember(organizationId, userId);

    const invitations = await invitationRepository.findByOrganization(organizationId);
    return invitations.map(this.mapToResponse);
  },

  async acceptInvitation(userId: string, input: AcceptInvitationInput): Promise<{ organizationId: string; role: MemberRole }> {
    const tokenHash = this.hashToken(input.token);
    const invitation = await invitationRepository.findByTokenHash(tokenHash) as InvitationWithDetails | null;

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ConflictError('Invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ValidationError('Invitation has expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AuthorizationError('This invitation is for a different email address');
    }

    const existingMember = await organizationRepository.isMember(invitation.organizationId, userId);
    if (existingMember) {
      throw new ConflictError('You are already a member of this organization');
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    return {
      organizationId: invitation.organizationId,
      role: invitation.role,
    };
  },

  async revokeInvitation(organizationId: string, userId: string, invitationId: string): Promise<void> {
    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new AuthorizationError('Only owners and admins can revoke invitations');
    }

    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ValidationError('Cannot revoke accepted invitation');
    }

    await invitationRepository.delete(invitationId);
  },

  mapToResponse(invitation: InvitationWithInvitedBy): InvitationResponse {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      invitedBy: {
        id: invitation.invitedBy.id,
        name: invitation.invitedBy.name,
        email: invitation.invitedBy.email,
      },
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    };
  },

  mapToResponseWithToken(invitation: Invitation, token: string, acceptUrl: string): InvitationWithToken {
    const invWithInvitedBy = invitation as InvitationWithInvitedBy;
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      invitedBy: {
        id: invWithInvitedBy.invitedBy.id,
        name: invWithInvitedBy.invitedBy.name,
        email: invWithInvitedBy.invitedBy.email,
      },
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      token,
      acceptUrl,
    };
  },
};