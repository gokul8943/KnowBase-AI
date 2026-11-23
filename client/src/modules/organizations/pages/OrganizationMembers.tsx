import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { organizationApi } from '../api/organizationApi';
import { UserPlus, User, Shield, Crown, MoreHorizontal, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Badge,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertDescription,
  EmptyState,
  TableSkeleton,
  FormField,
} from '../../../components/ui';

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

const roleBadges: Record<MemberRole, { variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info'; icon: React.ReactNode }> = {
  OWNER: { variant: 'warning', icon: <Crown className="mr-1.5 h-3 w-3" /> },
  ADMIN: { variant: 'info', icon: <Shield className="mr-1.5 h-3 w-3" /> },
  MEMBER: { variant: 'secondary', icon: <User className="mr-1.5 h-3 w-3" /> },
};

export function OrganizationMembers() {
  const { activeOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      queryClient.invalidateQueries({ queryKey: ['members', activeOrganization?.id] });
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
    reset: resetInviteForm,
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

  const currentUserIsOwner = members.some((m) => m.user.id === activeOrganization?.id && m.role === 'OWNER');

  const membersWithPermissions = members.map((member): MemberWithActions => {
    const isCurrentUser = member.user.id === activeOrganization?.id;
    const isOnlyOwner = member.role === 'OWNER' && members.filter((m) => m.role === 'OWNER').length === 1;
    const canManage = !isCurrentUser && !isOnlyOwner && (currentUserIsOwner || member.role === 'MEMBER');
    const canRemove = canManage && member.role !== 'OWNER';

    return { ...member, canManage, canRemove };
  });

  const filteredMembers = membersWithPermissions.filter(
    (member) =>
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <User className="h-6 w-6 text-primary" />
            <span>Members</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage organization members and their roles</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="glass">
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
                <Alert variant="success">
                  <AlertDescription>{inviteSuccess}</AlertDescription>
                </Alert>
              )}
              <FormField
                label="Email"
                error={inviteErrors.email?.message}
                required
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  {...inviteRegister('email')}
                  disabled={inviteMutation.isPending}
                />
              </FormField>
              <FormField
                label="Role"
                error={inviteErrors.role?.message}
                required
              >
                <Controller
                  name="role"
                  control={control}
                  render={({ field }: { field: { value: string; onChange: (value: string) => void } }) => (
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
              </FormField>
              <DialogFooter>
                <Button type="button" variant="glass" onClick={() => {
                  setInviteDialogOpen(false);
                  resetInviteForm();
                  setInviteError(null);
                  setInviteSuccess(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" variant="glass" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>All members of this organization</CardDescription>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={<User className="h-6 w-6 text-muted-foreground" />}
              title={searchQuery ? 'No members found' : 'No members yet'}
              description={searchQuery
                ? 'Try adjusting your search query.'
                : 'Invite team members to start collaborating.'}
              action={
                <Button
                  variant="glass"
                  onClick={() => {
                    setInviteDialogOpen(true);
                    resetInviteForm();
                    setInviteError(null);
                    setInviteSuccess(null);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadges[member.role].variant} className="gap-1.5">
                          {roleBadges[member.role].icon}
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
                            <Button variant="glass" size="icon" aria-label="Member actions">
                              <MoreHorizontal className="h-4 w-4" />
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