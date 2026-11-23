import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { workspaceApi } from '../../../modules/workspaces/api/workspaceApi';
import { Loader2, Building2, Settings, Edit2, Save, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
  AlertDescription,
  FormField,
} from '../../../components/ui';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Workspace</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace settings</p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : workspace ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    {isEditing ? (
                      <FormField
                        label="Workspace Name"
                        error={errors.name?.message}
                        required
                      >
                        <Input
                          {...register('name')}
                          disabled={updateMutation.isPending}
                          className="w-full sm:w-96"
                        />
                      </FormField>
                    ) : (
                      <>
                        <h2 className="text-xl font-semibold">{workspace.name}</h2>
                        <Badge variant="secondary" className="mt-1">
                          {activeOrganization.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:ml-auto">
                  {isEditing ? (
                    <>
                      <Button variant="glass" size="icon" onClick={handleCancel} aria-label="Cancel editing">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="submit"
                        form="workspace-form"
                        variant="glass"
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
                    <Button variant="glass" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} id="workspace-form" className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert variant="success">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {!isEditing ? (
                  <>
                    <FormField label="Description">
                      <p className="text-muted-foreground">
                        {workspace.description || 'No description provided'}
                      </p>
                    </FormField>
                    <FormField label="Organization">
                      <p>{activeOrganization.name}</p>
                    </FormField>
                    <FormField label="Created">
                      <p>{format(new Date(workspace.createdAt), 'PPP')}</p>
                    </FormField>
                  </>
                ) : (
                  <>
                    <FormField
                      label="Workspace Name"
                      error={errors.name?.message}
                      required
                    >
                      <Input
                        id="name"
                        {...register('name')}
                        disabled={updateMutation.isPending}
                      />
                    </FormField>
                    <FormField
                      label="Description"
                      error={errors.description?.message}
                    >
                      <Textarea
                        id="description"
                        {...register('description')}
                        disabled={updateMutation.isPending}
                        rows={3}
                      />
                    </FormField>
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
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Workspace ID</dt>
                  <dd className="mt-1 font-mono text-sm">{workspace.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Organization</dt>
                  <dd className="mt-1">{activeOrganization.name} ({activeOrganization.slug})</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1">{format(new Date(workspace.createdAt), 'PPP')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1">{format(new Date(workspace.updatedAt), 'PPP')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle>No Workspace Found</CardTitle>
            <CardDescription>This organization doesn&apos;t have a workspace yet.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}