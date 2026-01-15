import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, FileSpreadsheet, FolderKanban, Layers, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ParsedResult } from '@/hooks/useSpreadsheetParser';

interface ValidationSummaryProps {
  result: ParsedResult;
  ignoredRowsCount: number;
}

export function ValidationSummary({ result, ignoredRowsCount }: ValidationSummaryProps) {
  const { summary, status } = result;
  
  const effectiveValidTasks = summary.validTasks - ignoredRowsCount;
  const effectiveTotal = summary.totalTasks - ignoredRowsCount;
  
  const getStatusColor = () => {
    if (status === 'error') return 'border-destructive/30 bg-destructive/5';
    if (status === 'warning') return 'border-warning/30 bg-warning/5';
    return 'border-success/30 bg-success/5';
  };

  const getStatusIcon = () => {
    if (status === 'error') return <XCircle className="w-5 h-5 text-destructive" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-warning" />;
    return <CheckCircle2 className="w-5 h-5 text-success" />;
  };

  const getStatusText = () => {
    if (status === 'error') {
      return `${summary.tasksWithErrors} tarefa${summary.tasksWithErrors > 1 ? 's' : ''} com erros bloqueantes`;
    }
    if (status === 'warning') {
      return `${effectiveValidTasks} tarefa${effectiveValidTasks > 1 ? 's' : ''} pronta${effectiveValidTasks > 1 ? 's' : ''} com ${summary.tasksWithWarnings} aviso${summary.tasksWithWarnings > 1 ? 's' : ''}`;
    }
    return `${effectiveValidTasks} tarefa${effectiveValidTasks > 1 ? 's' : ''} pronta${effectiveValidTasks > 1 ? 's' : ''} para importação`;
  };

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={cn('border-2', getStatusColor())}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="font-semibold">{getStatusText()}</p>
              {ignoredRowsCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {ignoredRowsCount} linha{ignoredRowsCount > 1 ? 's' : ''} ignorada{ignoredRowsCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{effectiveTotal}</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalProjects}</p>
              <p className="text-xs text-muted-foreground">Projetos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalSprints}</p>
              <p className="text-xs text-muted-foreground">Sprints</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              summary.unmatchedMembersCount > 0 ? 'bg-warning/10' : 'bg-muted'
            )}>
              <Users className={cn(
                'w-4 h-4',
                summary.unmatchedMembersCount > 0 ? 'text-warning' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.unmatchedMembersCount}</p>
              <p className="text-xs text-muted-foreground">Novos membros</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Counts */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5 py-1">
          <CheckCircle2 className="w-3 h-3 text-success" />
          <span className="font-normal">{summary.validTasks} válidas</span>
        </Badge>
        {summary.tasksWithWarnings > 0 && (
          <Badge variant="outline" className="gap-1.5 py-1 border-warning text-warning">
            <AlertCircle className="w-3 h-3" />
            <span className="font-normal">{summary.tasksWithWarnings} com avisos</span>
          </Badge>
        )}
        {summary.tasksWithErrors > 0 && (
          <Badge variant="outline" className="gap-1.5 py-1 border-destructive text-destructive">
            <XCircle className="w-3 h-3" />
            <span className="font-normal">{summary.tasksWithErrors} com erros</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
