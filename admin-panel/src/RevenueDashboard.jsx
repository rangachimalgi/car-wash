import React, { useState } from 'react';

const RevenueDashboard = () => {
  const [activeTab, setActiveTab] = useState('Month');

  // Hardcoded chart points to match the provided image shape
  const points = [
    { x: 5, y: 70, date: 'Sep 1' }, { x: 12, y: 70, date: 'Sep 4' },
    { x: 20, y: 62, date: 'Sep 6' }, { x: 28, y: 68, date: 'Sep 8' },
    { x: 35, y: 55, date: 'Sep 10' }, { x: 42, y: 52, date: 'Sep 12' },
    { x: 50, y: 45, date: 'Sep 14' }, { x: 58, y: 38, date: 'Sep 16' },
    { x: 65, y: 42, date: 'Sep 18' }, { x: 72, y: 48, date: 'Sep 20' },
    { x: 80, y: 32, date: 'Sep 22' }, { x: 88, y: 30, date: 'Sep 24' },
    { x: 95, y: 15, date: 'Sep 30' }
  ];

  // SVG Path generation
  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `${linePath} L 95,90 L 5,90 Z`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <h2 style={styles.title}>Monthly Revenue</h2>
            <div style={styles.infoIcon}>i</div>
          </div>
          
          <div style={styles.tabGroup}>
            {['Day', 'Week', 'Month', 'Year', 'Date Range'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div style={styles.chartWrapper}>
          {/* Tooltip (Hardcoded position for Demo) */}
          <div style={styles.tooltip}>
            <div style={styles.tooltipLabel}>Revenue</div>
            <div style={styles.tooltipValue}>$12,540 <span style={styles.trendUp}>↑</span></div>
            <div style={styles.tooltipSub}>vs Aug 9th $11,004</div>
            <div style={styles.tooltipDate}>Sep 17th, 2024</div>
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.svg}>
            <defs>
              <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[15, 40, 65, 90].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeDasharray="1" />
            ))}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#fade)" />

            {/* Main Line */}
            <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Hover Vertical Line */}
            <line x1="58" y1="15" x2="58" y2="90" stroke="#000" strokeWidth="0.3" />
          </svg>

          {/* Y-Axis Labels */}
          <div style={styles.yLabels}>
            <div>14k</div><div>14k</div><div>12k</div><div>10k</div><div>8k</div>
          </div>

          {/* X-Axis Labels */}
          <div style={styles.xLabels}>
            {points.filter((_, i) => i % 2 === 0).map((p, i) => (
              <span key={i}>{p.date}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: 0, backgroundColor: 'transparent', minHeight: 'auto', fontFamily: 'inherit' },
  card: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, boxShadow: 'none', maxWidth: 'none', margin: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  title: { fontSize: '20px', fontWeight: '600', color: '#1e293b' },
  infoIcon: { width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#64748b', cursor: 'help' },
  tabGroup: { backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' },
  tabBtn: { border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer', transition: '0.2s' },
  chartWrapper: {
    position: 'relative',
    height: '380px',
    marginTop: '12px',
    borderRadius: '12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    padding: '18px 16px 42px 44px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  svg: { width: '100%', height: '100%', overflow: 'hidden', borderRadius: '8px' },
  yLabels: {
    position: 'absolute',
    left: '10px',
    top: '18px',
    bottom: '46px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94a3b8',
  },
  xLabels: {
    position: 'absolute',
    left: '44px',
    right: '16px',
    bottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94a3b8',
  },
  tooltip: {
    position: 'absolute', left: '48%', top: '25%', backgroundColor: '#fff', padding: '12px', borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 10, minWidth: '140px'
  },
  tooltipLabel: { fontSize: '11px', color: '#64748b', marginBottom: '4px' },
  tooltipValue: { fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' },
  trendUp: { color: '#22c55e', fontSize: '14px', backgroundColor: '#f0fdf4', padding: '2px 4px', borderRadius: '4px' },
  tooltipSub: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },
  tooltipDate: { fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }
};

export default RevenueDashboard;
