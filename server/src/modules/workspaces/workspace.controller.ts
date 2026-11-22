import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { workspaceService } from './workspace.service';
import type { ApiResponse } from '../../shared/types';
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema } from './workspace.validation';
import crypto from 'crypto';

const generateRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || crypto.randomUUID();
};

export const workspaceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.params.organizationId;
    const userId = req.user!.id;

    const workspaces = await workspaceService.listWorkspaces(organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { workspaces },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId;
    const userId = req.user!.id;

    const workspace = await workspaceService.getWorkspace(workspaceId, userId);

    const response: ApiResponse = {
      success: true,
      data: workspace,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validated = createWorkspaceSchema.parse({ params: req.params, body: req.body });
    const userId = req.user!.id;

    const workspace = await workspaceService.createWorkspace(validated.params.organizationId, userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: workspace,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.status(201).json(response);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const validated = updateWorkspaceSchema.parse({ params: req.params, body: req.body });
    const userId = req.user!.id;

    const workspace = await workspaceService.updateWorkspace(validated.params.workspaceId, userId, validated.body);

    const response: ApiResponse = {
      success: true,
      data: workspace,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const validated = workspaceIdParamSchema.parse({ params: req.params });
    const userId = req.user!.id;

    await workspaceService.deleteWorkspace(validated.params.workspaceId, userId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Workspace deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(req),
      },
    };
    res.json(response);
  }),
};