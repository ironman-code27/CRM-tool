import React, { useEffect, useState, useMemo } from 'react';

// 1. Animated Number Component using requestAnimationFrame (0 -> value, 800ms)
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850; // duration in ms (700-1000ms range)
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad function
      const easeProgress = progress * (2 - progress);
      setDisplayValue(Math.floor(easeProgress * (endValue - startValue) + startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

// Types of sparkline profiles
type SparklineProfile = 
  | 'total-leads'
  | 'new-leads'
  | 'contacted'
  | 'qualified'
  | 'closed'
  | 'activities'
  | 'open-tasks';

interface SparklineProps {
  profile: SparklineProfile;
  colorStart: string;
  colorEnd: string;
  width: number;
  height: number;
}

// 2. Premium SVG Sparkline Component
const Sparkline: React.FC<SparklineProps> = ({ profile, colorStart, colorEnd, width, height }) => {
  const uniqueId = useMemo(() => `${profile}-${Math.random().toString(36).substr(2, 9)}`, [profile]);

  // Points mapping for grid width=100, height=30
  const points = useMemo(() => {
    switch (profile) {
      case 'total-leads':
        // Smooth upward trend, ends higher
        return [
          { x: 0, y: 26 }, { x: 15, y: 23 }, { x: 30, y: 24 }, 
          { x: 45, y: 15 }, { x: 60, y: 17 }, { x: 75, y: 8 }, 
          { x: 90, y: 10 }, { x: 100, y: 4 }
        ];
      case 'new-leads':
        // Small daily peaks, organic growth
        return [
          { x: 0, y: 24 }, { x: 15, y: 12 }, { x: 30, y: 22 }, 
          { x: 45, y: 8 }, { x: 60, y: 18 }, { x: 75, y: 14 }, 
          { x: 90, y: 6 }, { x: 100, y: 5 }
        ];
      case 'contacted':
        // Stable trend with gentle waves
        return [
          { x: 0, y: 15 }, { x: 20, y: 19 }, { x: 40, y: 12 }, 
          { x: 60, y: 17 }, { x: 80, y: 13 }, { x: 100, y: 15 }
        ];
      case 'qualified':
        // Small fluctuations, less volatile
        return [
          { x: 0, y: 18 }, { x: 20, y: 14 }, { x: 40, y: 19 }, 
          { x: 60, y: 15 }, { x: 80, y: 18 }, { x: 100, y: 13 }
        ];
      case 'closed':
        // Positive upward trend, ends with strongest point
        return [
          { x: 0, y: 28 }, { x: 20, y: 24 }, { x: 40, y: 17 }, 
          { x: 60, y: 14 }, { x: 80, y: 7 }, { x: 100, y: 3 }
        ];
      case 'activities':
        // Frequent tiny peaks
        return [
          { x: 0, y: 20 }, { x: 10, y: 10 }, { x: 20, y: 22 }, 
          { x: 30, y: 8 }, { x: 40, y: 24 }, { x: 50, y: 12 }, 
          { x: 60, y: 19 }, { x: 70, y: 6 }, { x: 80, y: 21 }, 
          { x: 90, y: 11 }, { x: 100, y: 14 }
        ];
      case 'open-tasks':
        // Mostly flat with small spikes
        return [
          { x: 0, y: 21 }, { x: 18, y: 22 }, { x: 36, y: 20 }, 
          { x: 50, y: 6 }, { x: 64, y: 20 }, { x: 82, y: 22 }, 
          { x: 100, y: 21 }
        ];
      default:
        return [{ x: 0, y: 15 }, { x: 100, y: 15 }];
    }
  }, [profile]);

  // Scale points to actual SVG viewbox
  const scaledPoints = useMemo(() => {
    return points.map(p => ({
      x: (p.x / 100) * width,
      y: (p.y / 30) * height
    }));
  }, [points, width, height]);

  // Convert scaled points to smooth bezier path
  const linePath = useMemo(() => {
    if (scaledPoints.length === 0) return '';
    let path = `M ${scaledPoints[0].x} ${scaledPoints[0].y}`;
    for (let i = 0; i < scaledPoints.length - 1; i++) {
      const p0 = scaledPoints[i];
      const p1 = scaledPoints[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [scaledPoints]);

  const areaPath = useMemo(() => {
    if (!linePath || scaledPoints.length === 0) return '';
    return `${linePath} L ${scaledPoints[scaledPoints.length - 1].x} ${height} L ${scaledPoints[0].x} ${height} Z`;
  }, [linePath, scaledPoints, height]);

  return (
    <svg 
      className="db-sparkline-svg" 
      viewBox={`0 0 ${width} ${height}`} 
      style={{ width: '100%', height: `${height}px` }}
    >
      <defs>
        {/* Subtle stroke gradient */}
        <linearGradient id={`stroke-grad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colorStart} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>

        {/* Very soft area fill gradient */}
        <linearGradient id={`area-grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorStart} stopOpacity="0.08" />
          <stop offset="100%" stopColor={colorEnd} stopOpacity="0.00" />
        </linearGradient>

        {/* Blur filter for the subtle glow */}
        <filter id={`blur-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
      </defs>

      {/* 1. Soft Area Fill Under the Line (5-8% opacity) */}
      <path 
        d={areaPath} 
        fill={`url(#area-grad-${uniqueId})`} 
        className="db-sparkline-area"
      />

      {/* 2. Glow Path Layer (Subtle glow, blur, opacity 15%) */}
      <path 
        d={linePath} 
        fill="none" 
        stroke={colorEnd} 
        strokeWidth="6" 
        opacity="0.15" 
        filter={`url(#blur-${uniqueId})`}
        className="db-sparkline-glow"
      />

      {/* 3. Main Foreground Path (Gradient stroke, round joints, 2.5px width) */}
      <path
        d={linePath}
        fill="none"
        stroke={`url(#stroke-grad-${uniqueId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="300"
        strokeDashoffset="300"
        className="db-sparkline-line"
        style={{
          animation: 'dbSparklineDraw 0.75s ease-out forwards',
        }}
      />
    </svg>
  );
};

interface StatsCardProps {
  label: string;
  val: number;
  subtitle: string;
  colorStart: string;
  colorEnd: string;
  bgColor: string;
  icon: string;
  delayIndex: number;
  profile: SparklineProfile;
}

const StatCard: React.FC<StatsCardProps> = ({
  label,
  val,
  subtitle,
  colorStart,
  colorEnd,
  bgColor,
  icon,
  delayIndex,
  profile,
}) => {
  return (
    <div 
      className="db-card db-card-small db-animate-fade-in"
      style={{ animationDelay: `${delayIndex * 60}ms` }}
    >
      <div className="db-card-header">
        <div>
          <span className="db-card-title">{label}</span>
          <div className="db-card-subtitle">{subtitle}</div>
        </div>
        <div className="db-card-icon" style={{ backgroundColor: bgColor, color: colorStart }}>
          {icon}
        </div>
      </div>
      
      <div className="db-card-footer">
        <div className="db-card-val">
          <AnimatedNumber value={val} />
        </div>
        <div className="db-sparkline-container" style={{ width: '100px' }}>
          <Sparkline 
            profile={profile} 
            colorStart={colorStart} 
            colorEnd={colorEnd} 
            width={100} 
            height={30} 
          />
        </div>
      </div>
    </div>
  );
};

interface DashboardStatsProps {
  leadsCount: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  closedCount: number;
  activitiesCount: number;
  openTasksCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  leadsCount,
  newCount,
  contactedCount,
  qualifiedCount,
  closedCount,
  activitiesCount,
  openTasksCount,
}) => {
  return (
    <div className="db-stats-container">
      {/* LEFT SIDE: Total Leads (Spans two rows vertically) */}
      <div 
        className="db-card db-card-large db-animate-fade-in"
        style={{ animationDelay: '0ms' }}
      >
        <div className="db-card-header">
          <div>
            <span className="db-card-title" style={{ fontSize: '13px' }}>Total Leads</span>
            <div className="db-card-subtitle" style={{ fontSize: '12px' }}>All time leads count</div>
          </div>
          <div 
            className="db-card-icon" 
            style={{ 
              backgroundColor: 'rgba(39, 5, 124, 0.08)', 
              color: '#27057C',
              width: '42px',
              height: '42px',
              fontSize: '18px'
            }}
          >
            👥
          </div>
        </div>

        <div style={{ marginTop: 'auto', marginBottom: '8px' }}>
          <div className="db-card-val">
            <AnimatedNumber value={leadsCount} />
          </div>
          <div className="db-card-subtitle" style={{ marginTop: '6px', fontWeight: 500 }}>
            Active CRM Pipeline Database
          </div>
        </div>

        <div className="db-sparkline-container" style={{ width: '100%', padding: '0 4px' }}>
          <Sparkline 
            profile="total-leads" 
            colorStart="#5B3DF5" 
            colorEnd="#7C4DFF" 
            width={270} 
            height={50} 
          />
        </div>
      </div>

      {/* RIGHT SIDE: 3 x 2 Grid */}
      <div className="db-stats-right-grid">
        <StatCard
          label="New"
          val={newCount}
          subtitle="New this month"
          colorStart="#2563EB"
          colorEnd="#4F46E5"
          bgColor="rgba(37, 99, 235, 0.08)"
          icon="👤"
          delayIndex={1}
          profile="new-leads"
        />
        <StatCard
          label="Contacted"
          val={contactedCount}
          subtitle="In progress leads"
          colorStart="#5B3DF5"
          colorEnd="#7C4DFF"
          bgColor="rgba(91, 61, 245, 0.08)"
          icon="📞"
          delayIndex={2}
          profile="contacted"
        />
        <StatCard
          label="Qualified"
          val={qualifiedCount}
          subtitle="Qualified leads"
          colorStart="#EA580C"
          colorEnd="#FB923C"
          bgColor="rgba(234, 88, 12, 0.08)"
          icon="🏅"
          delayIndex={3}
          profile="qualified"
        />
        <StatCard
          label="Closed"
          val={closedCount}
          subtitle="Successfully closed"
          colorStart="#16A34A"
          colorEnd="#34D399"
          bgColor="rgba(22, 163, 74, 0.08)"
          icon="✅"
          delayIndex={4}
          profile="closed"
        />
        <StatCard
          label="Activities"
          val={activitiesCount}
          subtitle="Pending activities"
          colorStart="#DB2777"
          colorEnd="#EC4899"
          bgColor="rgba(219, 39, 119, 0.08)"
          icon="⚡"
          delayIndex={5}
          profile="activities"
        />
        <StatCard
          label="Open Tasks"
          val={openTasksCount}
          subtitle="Tasks to do"
          colorStart="#DC2626"
          colorEnd="#F87171"
          bgColor="rgba(220, 38, 38, 0.08)"
          icon="📋"
          delayIndex={6}
          profile="open-tasks"
        />
      </div>
    </div>
  );
};

export default DashboardStats;
