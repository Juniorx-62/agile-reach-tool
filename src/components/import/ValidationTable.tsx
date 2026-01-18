import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ParsedTask, ValidationError } from '@/hooks/useSpreadsheetParser';
import { cn } from '@/lib/utils';
import { formatHours } from '@/lib/formatters';

interface ValidationTableProps {
  tasks: ParsedTask[];
  errors: ValidationError[];
  onCreateMember: (firstName: string) => void;
  onIgnoreRow: (rowIndex: number) => void;
  onEditCell: (rowIndex: number, field: keyof ParsedTask, value: any) => void;
  ignoredRows: Set<number>;
}

// Cell status colors
const getCellStatus = (
  rowIndex: number, 
  column: string, 
  errors: ValidationError[]
): 'valid' | 'warning' | 'error' | 'ignored' => {
  const cellErrors = errors.filter(e => e.row === rowIndex && e.column === column);
  
  if (cellErrors.some(e => e.severity === 'error')) return 'error';
  if (cellErrors.some(e => e.severity === 'warning')) return 'warning';
  return 'valid';
};

const getCellClasses = (status: 'valid' | 'warning' | 'error' | 'ignored') => {
  switch (status) {
    case 'error':
      return 'bg-destructive/10 border-l-2 border-l-destructive';
    case 'warning':
      return 'bg-warning/10 border-l-2 border-l-warning';
    case 'ignored':
      return 'bg-muted/50 text-muted-foreground';
    default:
      return '';
  }
};

const getCellIcon = (status: 'valid' | 'warning' | 'error' | 'ignored') => {
  switch (status) {
    case 'error':
      return <XCircle className="w-3 h-3 text-destructive" />;
    case 'warning':
      return <AlertCircle className="w-3 h-3 text-warning" />;
    case 'valid':
      return <CheckCircle2 className="w-3 h-3 text-success" />;
    default:
      return null;
  }
};

export function ValidationTable({
  tasks,
  errors,
  onCreateMember,
  onIgnoreRow,
  onEditCell,
  ignoredRows,
}: ValidationTableProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (rowIndex: number, field: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, field });
    setEditValue(String(currentValue || ''));
  };

  const handleSaveEdit = () => {
    if (editingCell) {
      onEditCell(editingCell.row, editingCell.field as keyof ParsedTask, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getErrorsForCell = (rowIndex: number, column: string) => {
    return errors.filter(e => e.row === rowIndex && e.column === column);
  };

  const renderCell = (
    task: ParsedTask, 
    field: string, 
    value: any, 
    column: string
  ) => {
    const rowIndex = task.rowIndex;
    const status = ignoredRows.has(rowIndex) ? 'ignored' : getCellStatus(rowIndex, column, errors);
    const cellErrors = getErrorsForCell(rowIndex, column);
    const isEditing = editingCell?.row === rowIndex && editingCell?.field === field;

    return (
      <TooltipProvider key={`${rowIndex}-${field}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <TableCell 
              className={cn(
                'text-xs relative group cursor-pointer transition-colors',
                getCellClasses(status)
              )}
              onClick={() => !isEditing && handleStartEdit(rowIndex, field, value)}
            >
              <div className="flex items-center gap-1">
                {getCellIcon(status)}
                {isEditing ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="h-6 text-xs w-full"
                    autoFocus
                  />
                ) : (
                  <span className={cn(
                    'truncate max-w-[150px]',
                    value === null || value === '' || value === '-' ? 'text-muted-foreground italic' : ''
                  )}>
                    {value === null || value === '' ? '-' : String(value)}
                  </span>
                )}
                <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </TableCell>
          </TooltipTrigger>
          {cellErrors.length > 0 && (
            <TooltipContent>
              <div className="space-y-1">
                {cellErrors.map((err, idx) => (
                  <p key={idx} className={cn(
                    'text-xs',
                    err.severity === 'error' ? 'text-destructive' : 'text-warning'
                  )}>
                    {err.message}
                  </p>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[400px] overflow-y-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs w-16 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[100px]">Sprint</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[120px]">Projeto</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[100px]">Demanda</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[80px]">Prioridade</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[200px]">Título</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[90px]">Tipo</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[100px]">Categoria</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[140px]">Responsáveis</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[80px]">Estimativa</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[80px]">Intercorr.</TableHead>
                <TableHead className="text-xs whitespace-nowrap min-w-[70px]">Entregue</TableHead>
                <TableHead className="text-xs w-20 whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const rowIndex = task.rowIndex;
                const isIgnored = ignoredRows.has(rowIndex);
                const rowErrors = errors.filter(e => e.row === rowIndex);
                const hasErrors = rowErrors.some(e => e.severity === 'error');
                const hasWarnings = rowErrors.some(e => e.severity === 'warning');

                return (
                  <TableRow 
                    key={rowIndex} 
                    className={cn(
                      'transition-colors',
                      isIgnored && 'opacity-40 bg-muted/30',
                      !isIgnored && hasErrors && 'bg-destructive/5',
                      !isIgnored && !hasErrors && hasWarnings && 'bg-warning/5'
                    )}
                  >
                    <TableCell className="text-xs">
                      {isIgnored ? (
                        <Badge variant="outline" className="text-[10px]">Ignorado</Badge>
                      ) : hasErrors ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : hasWarnings ? (
                        <AlertCircle className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{task.sprint}</TableCell>
                    {renderCell(task, 'projeto', task.projeto, 'Projeto')}
                    {renderCell(task, 'demanda', task.demanda, 'Demanda')}
                    {renderCell(task, 'prioridade', task.prioridade !== null ? `p${task.prioridade}` : '-', 'Prioridade')}
                    {renderCell(task, 'titulo', task.titulo, 'Título')}
                    {renderCell(task, 'tipo', task.tipo, 'Tipo')}
                    {renderCell(task, 'categoria', task.categoria, 'Categoria')}
                    <TableCell className="text-xs">
                      <div className="flex flex-wrap gap-1 min-w-[120px]">
                        {task.responsaveis.length === 0 ? (
                          <span className="text-muted-foreground italic">-</span>
                        ) : (
                          task.responsaveis.map((r, i) => {
                            const hasError = errors.some(
                              e => e.row === rowIndex && 
                                   e.column === 'Responsável' && 
                                   e.message.includes(r)
                            );
                            return (
                              <Badge 
                                key={i}
                                variant={hasError ? 'outline' : 'secondary'}
                                className={cn(
                                  'text-[10px]',
                                  hasError && 'border-warning text-warning cursor-pointer hover:bg-warning/10'
                                )}
                                onClick={hasError ? () => onCreateMember(r) : undefined}
                              >
                                {hasError && <UserPlus className="w-3 h-3 mr-1" />}
                                {r}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    {renderCell(task, 'estimativa', task.estimativa > 0 ? `${formatHours(task.estimativa)}h` : '-', 'Estimativa')}
                    <TableCell className="text-xs">
                      <Badge variant={task.intercorrencia ? 'destructive' : 'secondary'} className="text-[10px]">
                        {task.intercorrencia ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={task.entregue ? 'default' : 'outline'} className="text-[10px]">
                        {task.entregue ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onIgnoreRow(rowIndex)}
                        title={isIgnored ? 'Restaurar linha' : 'Ignorar linha'}
                      >
                        <Trash2 className={cn(
                          'w-3 h-3',
                          isIgnored ? 'text-success' : 'text-destructive'
                        )} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
