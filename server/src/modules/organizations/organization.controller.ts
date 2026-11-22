import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { organizationService } from './organization.service';
import type { ApiResponse } from '../../shared/types';
import { createOrganizationSchema, updateOrganizationSchema, organizationIdParamSchema } from './organization.validation';
import crypto from 'crypto';

const generateRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || crypto.randomUUID();
};

export const organizationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const validated = createOrganizationSchema.parse({ body: req.body });
    const userId = req.user!.id;

    const organization = await organizationService.createOrganization(userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.status(201).json(response);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const organizations = await organizationService.listUserOrganizations(userId);

    const response: ApiResponse = {
      success: true,
      data: { organizations },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  getDetails: asyncHandler(async (req: Request, res: Response) => {
    const validated = organizationIdParamSchema.parse({ params: req.params });
    const userId = req.user!.id;

    const organization = await organizationService.getOrganizationDetails(validated.params.organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const validated = updateOrganizationSchema.parse({ params: req.params, body: req.body });
    const userId = req.user!.id;

    const organization = await organizationService.updateOrganization(validated.params.organizationId, userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: organization,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const validated = organizationIdParamSchema.parse({ params: req.params });
    const userId = req.user!.id;

    await organizationService.deleteOrganization(validated.params.organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Organization deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),
};