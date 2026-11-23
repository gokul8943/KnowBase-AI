import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrganization } from '../../../context/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, Calendar, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
  FormField,
  ConfirmationDialog,
} from '../../../components/ui';
import { format } from 'date-fns';

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type UpdateOrganizationForm = z.infer<typeof updateOrganizationSchema>;

export function OrganizationSettings() {
  const navigate = useNavigate();
  const { activeOrganization, updateOrganization, deleteOrganization } = useOrganization();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateOrganizationForm>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: activeOrganization?.name || '',
      description: activeOrganization?.description || '',
    },
  });

  const onSubmit = async (data: UpdateOrganizationForm) => {
    if (!activeOrganization) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateOrganization(activeOrganization.id, data);
      setSuccess('Organization updated successfully');
      reset(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update organization';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteOrganization(activeOrganization.id);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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
            <span>Organization Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your organization details and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your organization&apos;s name and description</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <FormField
              label="Organization Name"
              error={errors.name?.message}
              required
            >
              <Input
                id="name"
                {...register('name')}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Description"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                {...register('description')}
                disabled={isSubmitting}
                rows={3}
              />
            </FormField>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" variant="glass" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center space-x-2">
            <Trash2 className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting || isDeleting}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Read-only information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Organization ID</dt>
              <dd className="mt-1 font-mono text-sm">{activeOrganization.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Slug</dt>
              <dd className="mt-1 font-mono text-sm">{activeOrganization.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Your Role</dt>
              <dd className="mt-1 capitalize">{activeOrganization.role.toLowerCase()}</dd>
            </div>
            <div className="flex items-center space-x-1">
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{format(new Date(activeOrganization.createdAt), 'PPP')}</span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Organization"
        description={`Are you sure you want to delete "${activeOrganization.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete Organization"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}