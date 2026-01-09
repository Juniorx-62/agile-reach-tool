import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MemberWorkloadChartProps {
  data: Array<{
    name: string;
    memberId?: string;
    tasks: number;
    hours: number;
  }>;
  onMemberClick?: (memberId: string) => void;
}

export function MemberWorkloadChart({ data, onMemberClick }: MemberWorkloadChartProps) {
  const handleClick = (data: any) => {
    if (onMemberClick && data.memberId) {
      onMemberClick(data.memberId);
    }
  };

  return (
    <div className="stat-card h-[300px]">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas por Membro</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            width={80}
            tickFormatter={(value) => value.split(' ')[0]}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number, name: string) => [
              `${value} ${name === 'tasks' ? 'tarefas' : 'horas'}`,
              name === 'tasks' ? 'Tarefas' : 'Horas'
            ]}
          />
          <Bar 
            dataKey="tasks" 
            radius={[0, 4, 4, 0]} 
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`hsl(217, 91%, ${50 + index * 8}%)`}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Clique em um membro para ver detalhes
      </p>
    </div>
  );
}
