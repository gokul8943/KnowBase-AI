import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrganization } from '../../../context/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Loader2, Building2, Calendar } from 'lucide-react';
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
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteOrganization(activeOrganization.id);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span>Organization Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1">Manage your organization details and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your organization&apos;s name and description</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                rows={3}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" form="org-settings-form" disabled={isSubmitting}>
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
            <Building2 className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </div>

          {showDeleteConfirm && (
            <Alert variant="destructive">
              <AlertDescription>
                Are you sure you want to delete &ldquo;{activeOrganization.name}&rdquo;? This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {showDeleteConfirm && (
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Yes, Delete Organization'}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Read-only information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Organization ID</Label>
              <p className="font-mono text-sm">{activeOrganization.id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Slug</Label>
              <p className="font-mono text-sm">{activeOrganization.slug}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Your Role</Label>
              <p className="capitalize">{activeOrganization.role.toLowerCase()}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Created</Label>
              <p className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{format(new Date(activeOrganization.createdAt), 'PPP')}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}