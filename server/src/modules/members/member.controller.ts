import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { memberService } from './member.service';
import type { ApiResponse } from '../../shared/types';
import { memberIdParamSchema, updateMemberRoleSchema } from './member.validation';
import crypto from 'crypto';

const generateRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || crypto.randomUUID();
};

export const memberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.params.organizationId;
    const userId = req.user!.id;

    const members = await memberService.listMembers(organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { members },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const validated = updateMemberRoleSchema.parse({ params: req.params, body: req.body });
    const userId = req.user!.id;

    const member = await memberService.updateMemberRole(
      validated.params.organizationId,
      userId,
      validated.params.memberId,
      validated.body.role
    );

    const response: ApiResponse = {
      success: true,
      data: member,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const validated = memberIdParamSchema.parse({ params: req.params });
    const userId = req.user!.id;

    await memberService.removeMember(validated.params.organizationId, userId, validated.params.memberId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Member removed successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),
};