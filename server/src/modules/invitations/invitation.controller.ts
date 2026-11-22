import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { invitationService } from './invitation.service';
import type { ApiResponse } from '../../shared/types';
import { createInvitationSchema, listInvitationsSchema, invitationIdParamSchema, acceptInvitationSchema } from './invitation.validation';
import crypto from 'crypto';

const generateRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || crypto.randomUUID();
};

export const invitationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const validated = createInvitationSchema.parse({ params: req.params, body: req.body });
    const userId = req.user!.id;

    const invitation = await invitationService.createInvitation(validated.params.organizationId, userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: invitation,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.status(201).json(response);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const validated = listInvitationsSchema.parse({ params: req.params });
    const userId = req.user!.id;

    const invitations = await invitationService.listInvitations(validated.params.organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { invitations },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  revoke: asyncHandler(async (req: Request, res: Response) => {
    const validated = invitationIdParamSchema.parse({ params: req.params });
    const userId = req.user!.id;

    await invitationService.revokeInvitation(validated.params.organizationId, userId, validated.params.invitationId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Invitation revoked successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const validated = acceptInvitationSchema.parse({ body: req.body });
    const userId = req.user!.id;

    const result = await invitationService.acceptInvitation(userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Invitation accepted successfully',
        organizationId: result.organizationId,
        role: result.role,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),
};