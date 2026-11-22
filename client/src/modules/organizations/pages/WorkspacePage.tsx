import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { workspaceApi } from '../../../modules/workspaces/api/workspaceApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Loader2, Building2, Settings, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type UpdateWorkspaceForm = z.infer<typeof updateWorkspaceSchema>;

export function WorkspacePage() {
  const { activeOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', activeOrganization?.id],
    queryFn: () => workspaceApi.list(activeOrganization!.id),
    enabled: !!activeOrganization,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceForm }) =>
      workspaceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeOrganization?.id] });
      setIsEditing(false);
      setSuccess('Workspace updated successfully');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateWorkspaceForm>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspaces[0]?.name || '',
      description: workspaces[0]?.description || '',
    },
  });

  const workspace = workspaces[0];

  const onSubmit = (data: UpdateWorkspaceForm) => {
    if (!workspace) return;
    setError(null);
    setSuccess(null);
    updateMutation.mutate({ id: workspace.id, data });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      name: workspace?.name || '',
      description: workspace?.description || '',
    });
    setError(null);
    setSuccess(null);
  };

  if (!activeOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span>Workspace</span>
        </h1>
        <p className="text-muted-foreground mt-1">Manage your workspace settings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workspace ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {isEditing ? (
                      <Input
                        {...register('name')}
                        className="w-auto bg-transparent border-none focus:ring-0"
                        disabled={updateMutation.isPending}
                      />
                    ) : (
                      <span>{workspace.name}</span>
                    )}
                    <Badge variant="secondary" className="ml-2">
                      {activeOrganization.name}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {workspace.description || 'No description provided'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="icon" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="submit"
                        form="workspace-form"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} id="workspace-form" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert variant="default" className="border-green-500/50 bg-green-500/10">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {!isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <p className="text-muted-foreground">
                        {workspace.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <p>{activeOrganization.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Created</Label>
                      <p>{format(new Date(workspace.createdAt), 'PPP')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        disabled={updateMutation.isPending}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        disabled={updateMutation.isPending}
                        rows={3}
                        aria-invalid={!!errors.description}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Workspace Details</span>
              </CardTitle>
              <CardDescription>Read-only information about this workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Workspace ID</Label>
                  <p className="font-mono text-sm">{workspace.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Organization</Label>
                  <p>{activeOrganization.name} ({activeOrganization.slug})</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Created</Label>
                  <p>{format(new Date(workspace.createdAt), 'PPP')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <p>{format(new Date(workspace.updatedAt), 'PPP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Workspace Found</CardTitle>
            <CardDescription>This organization doesn&apos;t have a workspace yet.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}