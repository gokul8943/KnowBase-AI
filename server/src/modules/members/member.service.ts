import { memberRepository, type MemberWithUser } from './member.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { MemberRole } from '@prisma/client';
import type { MemberResponse } from './member.types';
import { NotFoundError, AuthorizationError } from '../../shared/errors/AppError';

export const memberService = {
  async listMembers(organizationId: string, userId: string): Promise<MemberResponse[]> {
    await organizationRepository.isMember(organizationId, userId);

    const members = await memberRepository.findByOrganization(organizationId);
    return members.map(this.mapToResponse);
  },

  async updateMemberRole(
    organizationId: string,
    requesterId: string,
    memberId: string,
    newRole: MemberRole
  ): Promise<MemberResponse> {
    const requesterMember = await organizationRepository.isMember(organizationId, requesterId);
    if (!requesterMember) {
      throw new AuthorizationError('You are not a member of this organization');
    }

    const targetMember = await memberRepository.findByIdWithUser(memberId);
    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new NotFoundError('Member');
    }

    if (!this.canManageMember(requesterMember.role, targetMember.role, newRole)) {
      throw new AuthorizationError('Insufficient permissions to change this member role');
    }

    if (requesterId === targetMember.userId && newRole !== requesterMember.role) {
      const ownerCount = await memberRepository.countByRole(organizationId, 'OWNER');
      if (ownerCount <= 1 && requesterMember.role === 'OWNER') {
        throw new AuthorizationError('Cannot change your own role as the only owner');
      }
    }

    if (requesterId === targetMember.userId && requesterMember.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await memberRepository.countByRole(organizationId, 'OWNER');
      if (ownerCount <= 1) {
        throw new AuthorizationError('Cannot demote the only owner');
      }
    }

    if (newRole === 'OWNER' && requesterMember.role !== 'OWNER') {
      throw new AuthorizationError('Only owners can promote to owner');
    }

    await memberRepository.updateRole(memberId, newRole);
    const memberWithUser = await memberRepository.findByIdWithUser(memberId);
    if (!memberWithUser) {
      throw new NotFoundError('Member');
    }

    return this.mapToResponse(memberWithUser);
  },

  async removeMember(organizationId: string, requesterId: string, memberId: string): Promise<void> {
    const requesterMember = await organizationRepository.isMember(organizationId, requesterId);
    if (!requesterMember) {
      throw new AuthorizationError('You are not a member of this organization');
    }

    const targetMember = await memberRepository.findByIdWithUser(memberId);
    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new NotFoundError('Member');
    }

    if (!this.canRemoveMember(requesterMember.role, targetMember.role)) {
      throw new AuthorizationError('Insufficient permissions to remove this member');
    }

    if (requesterId === targetMember.userId && requesterMember.role === 'OWNER') {
      const ownerCount = await memberRepository.countByRole(organizationId, 'OWNER');
      if (ownerCount <= 1) {
        throw new AuthorizationError('Cannot remove yourself as the only owner');
      }
    }

    if (targetMember.role === 'OWNER' && requesterMember.role !== 'OWNER') {
      throw new AuthorizationError('Only owners can remove other owners');
    }

    await memberRepository.delete(memberId);
  },

  canManageMember(requesterRole: MemberRole, targetRole: MemberRole, newRole: MemberRole): boolean {
    if (requesterRole === 'OWNER') {
      if (targetRole === 'OWNER' && newRole !== 'OWNER') return false;
      return true;
    }

    if (requesterRole === 'ADMIN') {
      if (targetRole === 'OWNER' || targetRole === 'ADMIN') return false;
      if (newRole === 'OWNER' || newRole === 'ADMIN') return false;
      return true;
    }

    return false;
  },

  canRemoveMember(requesterRole: MemberRole, targetRole: MemberRole): boolean {
    if (requesterRole === 'OWNER') {
      return true;
    }

    if (requesterRole === 'ADMIN') {
      return targetRole === 'MEMBER';
    }

    return false;
  },

  mapToResponse(member: MemberWithUser): MemberResponse {
    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        isActive: member.user.isActive,
        emailVerified: member.user.emailVerified,
      },
      role: member.role,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  },
};