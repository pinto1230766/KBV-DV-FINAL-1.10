import React, { useState } from 'react';

interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface DashboardDonutChartProps {
    data: ChartData[];
    title: string;
}

export const DashboardDonutChart: React.FC<DashboardDonutChartProps> = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const [hoveredSegment, setHoveredSegment] = useState<ChartData & { percent: number } | null>(null);

    let cumulativePercent = 0;
    const segments = data.map(item => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        const offset = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, offset };
    });

    const circumference = 2 * Math.PI * 40; // 40 is radius

    return (
        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-soft-lg h-full flex flex-col">
            <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark mb-4 text-center">{title}</h3>
            <div className="relative flex-grow flex items-center justify-center min-h-[12rem]">
                <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
                    <circle cx="50" cy="50" r="40" className="stroke-current text-gray-200 dark:text-primary-light/20" strokeWidth="12" fill="transparent" />
                    {segments.map(segment => (
                        <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r="40"
                            className={`stroke-current ${segment.color} transition-all duration-300 cursor-pointer`}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={`${circumference}`}
                            strokeDashoffset={circumference - (segment.percent / 100) * circumference}
                            strokeLinecap="round"
                            style={{ transform: `rotate(${(segment.offset / 100) * 360}deg)`, transformOrigin: '50% 50%' }}
                            onMouseEnter={() => setHoveredSegment(segment)}
                            onMouseLeave={() => setHoveredSegment(null)}
                        >
                            <title>{`${segment.label}: ${segment.value} (${segment.percent.toFixed(1)}%)`}</title>
                        </circle>
                    ))}
                </svg>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    {hoveredSegment ? (
                        <>
                            <span className="text-3xl font-bold text-text-main dark:text-text-main-dark">{hoveredSegment.value}</span>
                            <span className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">{hoveredSegment.label}</span>
                            <span className="text-xs text-text-muted dark:text-text-muted-dark">({hoveredSegment.percent.toFixed(1)}%)</span>
                        </>
                    ) : (
                         <>
                            <span className="text-3xl font-bold text-text-main dark:text-text-main-dark">{total}</span>
                            <span className="text-sm text-text-muted dark:text-text-muted-dark">Total</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-sm">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`}></span>
                        <span className="font-semibold text-text-main dark:text-text-main-dark">{item.label}</span>
                        <span className="text-text-muted dark:text-text-muted-dark">({item.value})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
