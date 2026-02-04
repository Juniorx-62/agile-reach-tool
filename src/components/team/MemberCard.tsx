import { Mail, Phone, Briefcase } from 'lucide-react';
import { TeamMember } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';

interface MemberCardProps {
  member: TeamMember;
  onClick?: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const { tasks, projects } = useApp();
  
  const memberTasks = tasks.filter(t => t.assignees.includes(member.id));
  const completedTasks = memberTasks.filter(t => t.isDelivered);
  const pendingTasks = memberTasks.filter(t => !t.isDelivered);
  
  const memberProjects = [...new Set(memberTasks.map(t => t.projectId))];
  const projectNames = memberProjects
    .map(pid => projects.find(p => p.id === pid)?.name)
    .filter(Boolean);

  const totalHours = memberTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedHours = completedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  return (
    <div 
      onClick={onClick}
      className="stat-card cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <AvatarPlaceholder
          name={member.name}
          photoUrl={member.photoUrl}
          size="lg"
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {member.name}
          </h4>
          
          {member.nickname && (
            <p className="text-xs text-muted-foreground">
              Apelido: {member.nickname}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{member.email}</span>
          </div>
          
          {member.phone && (
            <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {projectNames.length > 0 ? projectNames.join(', ') : 'Sem projetos'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold text-foreground">{memberTasks.length}</p>
            <p className="text-xs text-muted-foreground">Tarefas</p>
          </div>
          <div className="text-center p-2 bg-success/10 rounded-lg">
            <p className="text-lg font-bold text-success">{completedTasks.length}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="text-center p-2 bg-warning/10 rounded-lg">
            <p className="text-lg font-bold text-warning">{pendingTasks.length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Horas</span>
            <span className="font-medium">{completedHours}h / {totalHours}h</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill bg-primary"
              style={{ width: totalHours > 0 ? `${(completedHours / totalHours) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
