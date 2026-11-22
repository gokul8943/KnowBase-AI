import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { organizationApi } from '../api/organizationApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Controller } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Loader2, UserPlus, User, Shield, Crown, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../utils/cn';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface MemberWithActions {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
  };
  role: MemberRole;
  joinedAt: string;
  canManage: boolean;
  canRemove: boolean;
}

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

type InviteForm = z.infer<typeof inviteSchema>;

export function OrganizationMembers() {
  const { activeOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeOrganization?.id],
    queryFn: () => organizationApi.listMembers(activeOrganization!.id),
    enabled: !!activeOrganization,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => organizationApi.createInvitation(activeOrganization!.id, data),
    onSuccess: () => {
      setInviteSuccess('Invitation sent successfully');
      setInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invitations', activeOrganization?.id] });
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) =>
      organizationApi.updateMemberRole(activeOrganization!.id, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrganization?.id] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => organizationApi.removeMember(activeOrganization!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrganization?.id] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const {
    register: inviteRegister,
    handleSubmit: inviteHandleSubmit,
    control,
    formState: { errors: inviteErrors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });

  const onInviteSubmit = (data: InviteForm) => {
    setInviteError(null);
    setInviteSuccess(null);
    inviteMutation.mutate(data);
  };

  const handleRoleChange = (memberId: string, role: MemberRole) => {
    updateRoleMutation.mutate({ memberId, role });
  };

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate(memberId);
    }
  };

  const currentUserIsOwner = members.find((m) => m.user.id === activeOrganization?.id)?.role === 'OWNER';

  const membersWithPermissions = members.map((member): MemberWithActions => {
    const isCurrentUser = member.user.id === activeOrganization?.id;
    const isOnlyOwner = member.role === 'OWNER' && members.filter((m) => m.role === 'OWNER').length === 1;
    const canManage = !isCurrentUser && !isOnlyOwner && (currentUserIsOwner || member.role === 'MEMBER');
    const canRemove = canManage && member.role !== 'OWNER';

    return { ...member, canManage, canRemove };
  });

  if (!activeOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <User className="h-6 w-6 text-primary" />
            <span>Members</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage organization members and their roles</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={inviteHandleSubmit(onInviteSubmit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you want to invite. They will receive an invitation to join the organization.
                </DialogDescription>
              </DialogHeader>
              {inviteError && (
                <Alert variant="destructive">
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}
              {inviteSuccess && (
                <Alert variant="default" className="border-green-500/50 bg-green-500/10">
                  <AlertDescription>{inviteSuccess}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  {...inviteRegister('email')}
                  disabled={inviteMutation.isPending}
                />
                {inviteErrors.email && (
                  <p className="text-sm text-destructive">{inviteErrors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={inviteMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>All members of this organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersWithPermissions.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          member.role === 'OWNER' ? 'default' :
                          member.role === 'ADMIN' ? 'secondary' : 'outline'
                        } className={cn(
                          member.role === 'OWNER' && 'bg-yellow-100 text-yellow-800',
                          member.role === 'ADMIN' && 'bg-blue-100 text-blue-800'
                        )}>
                          {member.role === 'OWNER' && <Crown className="mr-1 h-3 w-3" />}
                          {member.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(member.joinedAt), 'PPP')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.canManage && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, 'ADMIN')}
                                  disabled={member.role === 'ADMIN' || inviteMutation.isPending}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, 'MEMBER')}
                                  disabled={member.role === 'MEMBER' || inviteMutation.isPending}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Make Member
                                </DropdownMenuItem>
                                {currentUserIsOwner && member.role !== 'OWNER' && (
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, 'OWNER')}
                                    disabled={inviteMutation.isPending}
                                  >
                                    <Crown className="mr-2 h-4 w-4" />
                                    Make Owner
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {member.canRemove && (
                                  <DropdownMenuItem
                                    onClick={() => handleRemove(member.id)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={inviteMutation.isPending}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {!member.canManage && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                No actions available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}