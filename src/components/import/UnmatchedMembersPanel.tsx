import React from 'react';
import { AlertCircle, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnmatchedMember } from '@/hooks/useSpreadsheetParser';

interface UnmatchedMembersPanelProps {
  members: UnmatchedMember[];
  onCreateMember: (firstName: string) => void;
  onCreateAllMembers: () => void;
}

export function UnmatchedMembersPanel({
  members,
  onCreateMember,
  onCreateAllMembers,
}: UnmatchedMembersPanelProps) {
  if (members.length === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            <CardTitle className="text-base">Membros não encontrados</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateAllMembers}
            className="gap-1.5"
          >
            <Users className="w-3 h-3" />
            Criar todos ({members.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Os seguintes responsáveis não foram encontrados no sistema. Você pode criá-los ou a importação prosseguirá sem atribuição.
        </p>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <Badge 
              key={member.firstName}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 gap-2"
              onClick={() => onCreateMember(member.firstName)}
            >
              <UserPlus className="w-3 h-3" />
              <span className="font-medium capitalize">{member.firstName}</span>
              <span className="text-muted-foreground text-[10px]">
                ({member.occurrences}x)
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
