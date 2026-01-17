import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

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

  // Calculate dynamic height based on number of members (min 200px, 40px per member)
  const chartHeight = Math.max(200, data.length * 40);
  
  // Get max value for domain padding - ensure minimum scale for visibility
  const maxTasks = Math.max(...data.map(d => d.tasks), 5);

  // Filter out members with 0 tasks but keep all others including low counts
  const filteredData = data.filter(d => d.tasks > 0);

  return (
    <div className="stat-card" style={{ minHeight: '300px' }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas por Membro</h3>
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Nenhum membro com tarefas atribuídas
        </div>
      ) : (
        <div 
          className="overflow-y-auto scrollbar-thin" 
          style={{ height: `${Math.min(chartHeight, 280)}px` }}
        >
          <div style={{ height: `${chartHeight}px`, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredData} 
                layout="vertical" 
                margin={{ left: 10, right: 50, top: 5, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} vertical={true} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  domain={[0, maxTasks + Math.ceil(maxTasks * 0.2)]}
                  allowDecimals={false}
                  tickCount={6}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  width={90}
                  tickFormatter={(value) => {
                    const firstName = value.split(' ')[0];
                    return firstName.length > 12 ? firstName.substring(0, 12) + '...' : firstName;
                  }}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  interval={0}
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
                  labelFormatter={(label) => label}
                />
                <Bar 
                  dataKey="tasks" 
                  radius={[0, 4, 4, 0]} 
                  onClick={handleClick}
                  style={{ cursor: 'pointer' }}
                  minPointSize={8}
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(217, 91%, ${Math.max(40, 60 - index * 5)}%)`}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                  <LabelList 
                    dataKey="tasks" 
                    position="right" 
                    fontSize={11}
                    fill="hsl(var(--foreground))"
                    offset={8}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center mt-2">
        Clique em um membro para ver detalhes
      </p>
    </div>
  );
}
