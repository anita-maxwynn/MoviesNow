import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Clock } from 'lucide-react';
import { meetsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  room: {
    id: string;
    name: string;
    creator_email: string;
  };
  invited_user: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const response = await meetsAPI.getMyInvitations();
      const data = response.data.results || response.data || [];
      // Ensure data is always an array
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]); // Set empty array on error
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    setAccepting(invitationId);
    try {
      await meetsAPI.acceptInvitation(invitationId);
      toast.success('Invitation accepted successfully!');
      fetchInvitations(); // Refresh the list
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error.response?.data?.error || 'Failed to accept invitation';
      toast.error(errorMessage);
    } finally {
      setAccepting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><Check className="w-3 h-3" />Accepted</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="w-3 h-3" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            My Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          My Invitations
        </CardTitle>
        <CardDescription>
          Manage your room invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invitations found
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation, index) => (
              <div key={invitation.id}>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{invitation.room.name}</h4>
                      {getStatusBadge(invitation.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From: {invitation.room.creator_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited: {formatDate(invitation.created_at)}
                    </p>
                  </div>
                  {invitation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={accepting === invitation.id}
                      >
                        {accepting === invitation.id ? 'Accepting...' : 'Accept'}
                      </Button>
                    </div>
                  )}
                </div>
                {index < invitations.length - 1 && <div className="border-t my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
