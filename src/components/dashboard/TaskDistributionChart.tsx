import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { useState } from 'react';

interface TaskDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  onSegmentClick?: (name: string) => void;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))' }}
      />
    </g>
  );
};

export function TaskDistributionChart({ data, title, onSegmentClick }: TaskDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const handleClick = (data: any, index: number) => {
    if (onSegmentClick && data.name) {
      onSegmentClick(data.name);
    }
  };

  return (
    <div className="stat-card h-[300px]">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => [`${value} tarefas`, '']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">{value}</span>}
            onClick={(data) => onSegmentClick && onSegmentClick(data.value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
