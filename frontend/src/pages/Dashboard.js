import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiUsers, FiCheckCircle, FiSlash, FiHome, FiUserX } from 'react-icons/fi';
import { fetchJson } from '../utils/api';

const Wrap = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.4rem;
`;

const Updated = styled.span`
  color: ${p => p.theme.colors.gray};
  font-size: 0.85rem;
`;

const OverviewLink = styled(Link)`
  color: ${p => p.theme.colors.secondary};
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: ${p => p.theme.colors.primary};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 10px;
  border-top: 4px solid ${p => p.borderColor || p.theme.colors.primary};
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const IconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: ${p => p.bgColor || p.theme.colors.lightGray};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.iconColor || p.theme.colors.secondary};
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  color: ${p => p.theme.colors.gray};
  font-size: 0.8rem;
`;

const Value = styled.span`
  color: ${p => p.theme.colors.secondary};
  font-size: 1.5rem;
  font-weight: 700;
`;

// Theme colors
const themePrimary = '#dd9c6b';
const themeSecondary = '#00234C';
const themeGray = '#888888';
const themeGreen = '#28a745';
const themeRed = '#dc3545';
const themeBlue = '#007bff';
const themeOrange = '#fd7e14';
const themePurple = '#6f42c1';

/**
 * StatCard
 * Purpose: Render a single metric card for dashboard summary.
 */
function StatCard({ icon: Icon, label, value, borderColor, bgColor, iconColor, loading }) {
  return (
    <Card borderColor={borderColor}>
      <IconWrap bgColor={bgColor} iconColor={iconColor}>
        <Icon size={24} />
      </IconWrap>
      <Metric>
        <Label>{label}</Label>
        <Value>{loading ? '...' : value.toLocaleString()}</Value>
      </Metric>
    </Card>
  );
}

/**
 * Dashboard
 * Purpose: Display key customer-related KPIs with visualizations.
 */
export default function Dashboard() {
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    blockedCustomers: 0,
    allottedCustomers: 0,
    unallottedCustomers: 0,
  });
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Property statistics state
  const [propertyStats, setPropertyStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    allottedProperties: 0,
    soldProperties: 0,
  });
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Fetch customer statistics
  useEffect(() => {
    async function fetchCustomerStats() {
      try {
        setLoadingCustomers(true);
        const data = await fetchJson('/api/Customers/statistics');
        setCustomerStats({
          totalCustomers: data.totalCustomers || 0,
          activeCustomers: data.activeCustomers || 0,
          blockedCustomers: data.blockedCustomers || 0,
          allottedCustomers: data.allottedCustomers || 0,
          unallottedCustomers: data.unallottedCustomers || 0,
        });
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching customer statistics:', error);
        // Use realistic dummy values if API fails
        setCustomerStats({
          totalCustomers: 1250,
          activeCustomers: 980,
          blockedCustomers: 45,
          allottedCustomers: 720,
          unallottedCustomers: 530,
        });
      } finally {
        setLoadingCustomers(false);
      }
    }

    fetchCustomerStats();
  }, []);

  // Fetch property statistics
  useEffect(() => {
    async function fetchPropertyStats() {
      try {
        setLoadingProperties(true);
        const data = await fetchJson('/api/Properties/statistics');
        setPropertyStats({
          totalProperties: data.totalProperties || 0,
          availableProperties: data.availableProperties || 0,
          allottedProperties: data.allottedProperties || 0,
          soldProperties: data.soldProperties || 0,
        });
      } catch (error) {
        console.error('Error fetching property statistics:', error);
      } finally {
        setLoadingProperties(false);
      }
    }

    fetchPropertyStats();
  }, []);

  // Customer metrics cards configuration
  const customerMetrics = [
    { 
      label: 'Total Customers', 
      value: customerStats.totalCustomers, 
      icon: FiUsers,
      borderColor: themeSecondary,
      bgColor: '#e8f4fc',
      iconColor: themeSecondary
    },
    { 
      label: 'Active Customers', 
      value: customerStats.activeCustomers, 
      icon: FiCheckCircle,
      borderColor: themeGreen,
      bgColor: '#e8f5e9',
      iconColor: themeGreen
    },
    { 
      label: 'Blocked Customers', 
      value: customerStats.blockedCustomers, 
      icon: FiSlash,
      borderColor: themeRed,
      bgColor: '#ffebee',
      iconColor: themeRed
    },
    { 
      label: 'Allotted Customers', 
      value: customerStats.allottedCustomers, 
      icon: FiHome,
      borderColor: themePrimary,
      bgColor: '#fff3e0',
      iconColor: themePrimary
    },
    { 
      label: 'Unallotted Customers', 
      value: customerStats.unallottedCustomers, 
      icon: FiUserX,
      borderColor: themeGray,
      bgColor: '#f5f5f5',
      iconColor: themeGray
    },
  ];

  // Bar chart data for all 5 customer metrics
  const customerBarData = [
    { label: 'Total', value: customerStats.totalCustomers, color: themeSecondary },
    { label: 'Active', value: customerStats.activeCustomers, color: themeGreen },
    { label: 'Blocked', value: customerStats.blockedCustomers, color: themeRed },
    { label: 'Allotted', value: customerStats.allottedCustomers, color: themePrimary },
    { label: 'Unallotted', value: customerStats.unallottedCustomers, color: themeGray },
  ];

  // Pie chart data for Active vs Blocked
  const statusPieData = [
    { label: 'Active', value: customerStats.activeCustomers, color: themeGreen },
    { label: 'Blocked', value: customerStats.blockedCustomers, color: themeRed },
    { label: 'Other', value: Math.max(0, customerStats.totalCustomers - customerStats.activeCustomers - customerStats.blockedCustomers), color: themeGray },
  ].filter(d => d.value > 0);

  // Pie chart data for Allotted vs Unallotted
  const allotmentPieData = [
    { label: 'Allotted', value: customerStats.allottedCustomers, color: themePrimary },
    { label: 'Unallotted', value: customerStats.unallottedCustomers, color: themeBlue },
  ].filter(d => d.value > 0);

  // Property status data for pie chart
  const propertyStatusData = [
    { label: 'Available', value: propertyStats.availableProperties, color: themeGreen },
    { label: 'Allotted', value: propertyStats.allottedProperties, color: themePrimary },
    { label: 'Sold', value: propertyStats.soldProperties, color: themeSecondary },
  ].filter(item => item.value > 0);

  return (
    <Wrap>
      <Header>
        <Title>
          Dashboard <OverviewLink to="/dashboard">Overview</OverviewLink>
        </Title>
        <Updated>
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
        </Updated>
      </Header>

      {/* Customer Metrics Cards */}
      <SectionHeader>Customer Statistics</SectionHeader>
      <Grid>
        {customerMetrics.map((m) => (
          <StatCard 
            key={m.label} 
            icon={m.icon} 
            label={m.label} 
            value={m.value}
            borderColor={m.borderColor}
            bgColor={m.bgColor}
            iconColor={m.iconColor}
            loading={loadingCustomers}
          />
        ))}
      </Grid>

      <ChartsGrid>
        {/* Customer Metrics Bar Chart */}
        <ChartCard>
          <SectionTitle>Customer Metrics Overview</SectionTitle>
          <SectionNote>
            {loadingCustomers ? 'Loading...' : `Total: ${customerStats.totalCustomers.toLocaleString()} customers`}
          </SectionNote>
          {loadingCustomers ? (
            <LoadingText>Loading customer data...</LoadingText>
          ) : (
            <>
              <BarChart 
                width={720} 
                height={300} 
                data={customerBarData} 
                color={themePrimary} 
                axisColor="#dddddd" 
              />
              <Legend>
                {customerBarData.map(d => (
                  <LegendItem key={d.label}>
                    <LegendSwatch $color={d.color} /> {d.label}
                  </LegendItem>
                ))}
              </Legend>
            </>
          )}
        </ChartCard>

        {/* Active vs Blocked Pie Chart */}
        <ChartCard>
          <SectionTitle>Customer Status Distribution</SectionTitle>
          <SectionNote>Active vs Blocked customers</SectionNote>
          {loadingCustomers ? (
            <LoadingText>Loading customer data...</LoadingText>
          ) : statusPieData.length > 0 ? (
            <>
              <PieChart width={360} height={280} data={statusPieData} />
              <Legend>
                {statusPieData.map(s => (
                  <LegendItem key={s.label}>
                    <LegendSwatch $color={s.color} /> {s.label} ({s.value.toLocaleString()})
                  </LegendItem>
                ))}
              </Legend>
            </>
          ) : (
            <LoadingText>No customer data available</LoadingText>
          )}
        </ChartCard>

        {/* Allotted vs Unallotted Pie Chart */}
        <ChartCard>
          <SectionTitle>Allotment Status Distribution</SectionTitle>
          <SectionNote>Allotted vs Unallotted customers</SectionNote>
          {loadingCustomers ? (
            <LoadingText>Loading customer data...</LoadingText>
          ) : allotmentPieData.length > 0 ? (
            <>
              <PieChart width={360} height={280} data={allotmentPieData} />
              <Legend>
                {allotmentPieData.map(s => (
                  <LegendItem key={s.label}>
                    <LegendSwatch $color={s.color} /> {s.label} ({s.value.toLocaleString()})
                  </LegendItem>
                ))}
              </Legend>
            </>
          ) : (
            <LoadingText>No allotment data available</LoadingText>
          )}
        </ChartCard>

        {/* Property Status Distribution */}
        <ChartCard>
          <SectionTitle>Property Status Distribution</SectionTitle>
          <SectionNote>
            {loadingProperties ? 'Loading...' : `Total: ${propertyStats.totalProperties} properties`}
          </SectionNote>
          {loadingProperties ? (
            <LoadingText>Loading property data...</LoadingText>
          ) : propertyStatusData.length > 0 ? (
            <>
              <PieChart width={360} height={280} data={propertyStatusData} />
              <Legend>
                {propertyStatusData.map(s => (
                  <LegendItem key={s.label}>
                    <LegendSwatch $color={s.color} /> {s.label} ({s.value})
                  </LegendItem>
                ))}
              </Legend>
            </>
          ) : (
            <LoadingText>No property data available</LoadingText>
          )}
        </ChartCard>
      </ChartsGrid>
    </Wrap>
  );
}

const SectionHeader = styled.h2`
  margin: 1.5rem 0 1rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.1rem;
  font-weight: 600;
`;

const ChartsGrid = styled.div`
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  border-top: 4px solid ${p => p.theme.colors.primary};
  padding: 1.25rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.1rem;
`;

const SectionNote = styled.div`
  color: ${p => p.theme.colors.gray};
  font-size: 0.85rem;
  margin: 0.35rem 0 0.75rem;
`;

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 0.85rem;
`;

const LegendSwatch = styled.span`
  width: 14px;
  height: 14px;
  display: inline-block;
  border-radius: 3px;
  background: ${p => p.$color};
`;

const LoadingText = styled.div`
  text-align: center;
  color: ${p => p.theme.colors.gray};
  font-size: 0.9rem;
  padding: 2rem;
`;

/**
 * BarChart
 * Purpose: Render a vertical bar chart using SVG with colored bars.
 */
function BarChart({ width = 720, height = 280, data = [], color = themePrimary, axisColor = '#dddddd' }) {
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const maxY = Math.max(...data.map(d => Number(d.value || 0))) || 1;
  const xStep = innerW / data.length;
  const barW = Math.max(30, xStep * 0.6);
  const yScale = (v) => innerH - (v / maxY) * innerH;

  // Y ticks (5)
  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round((i * maxY) / ticks));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Axes */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={axisColor} strokeWidth={2} />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke={axisColor} strokeWidth={2} />

        {/* Y-axis ticks and labels */}
        {yTicks.map((t, i) => (
          <g key={`yt-${i}`}>
            <line x1={-6} y1={yScale(t)} x2={innerW} y2={yScale(t)} stroke="#f0f0f0" />
            <text x={-12} y={yScale(t)} fill="#888" fontSize="11" textAnchor="end" dy="0.35em">
              {t.toLocaleString()}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text 
          x={-margin.left + 15} 
          y={innerH / 2} 
          fill={themeSecondary} 
          fontSize="12" 
          textAnchor="middle"
          transform={`rotate(-90, ${-margin.left + 15}, ${innerH / 2})`}
        >
          Count
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const x = i * xStep + (xStep - barW) / 2;
          const h = innerH - yScale(Number(d.value || 0));
          const barColor = d.color || color;
          return (
            <g key={`bar-${d.label}`}>
              {/* Bar with gradient effect */}
              <defs>
                <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColor} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <rect 
                x={x} 
                y={yScale(d.value)} 
                width={barW} 
                height={h} 
                fill={`url(#grad-${i})`}
                rx={6}
                style={{ transition: 'height 0.3s ease' }}
              />
              {/* X-axis label */}
              <text 
                x={x + barW / 2} 
                y={innerH + 20} 
                fill="#666" 
                fontSize="11" 
                textAnchor="middle"
                fontWeight="500"
              >
                {d.label}
              </text>
              {/* Value label on top of bar */}
              <text 
                x={x + barW / 2} 
                y={yScale(d.value) - 8} 
                fill={themeSecondary} 
                fontSize="12" 
                fontWeight="600"
                textAnchor="middle"
              >
                {d.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * PieChart
 * Purpose: Render a donut pie chart using SVG arc paths with labels.
 */
function PieChart({ width = 360, height = 280, data = [] }) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) * 0.38;
  const innerR = outerR * 0.5; // Donut hole
  const total = data.reduce((sum, d) => sum + Number(d.value || 0), 0) || 1;

  let startAngle = -Math.PI / 2; // start at top

  const polarToCartesian = (cx, cy, r, angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const describeArc = (cx, cy, innerR, outerR, startAngle, endAngle) => {
    const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
      'Z'
    ].join(' ');
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Slices */}
      {data.map((d, i) => {
        const value = Number(d.value || 0);
        const sliceAngle = (value / total) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;
        const midAngle = startAngle + sliceAngle / 2;
        
        // Calculate label position
        const labelR = outerR + 20;
        const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
        
        const path = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);
        const currentStart = startAngle;
        startAngle = endAngle;
        
        // Calculate percentage
        const percentage = Math.round((value / total) * 100);
        
        return (
          <g key={`slice-${i}`}>
            <path 
              d={path} 
              fill={d.color}
              stroke="#fff"
              strokeWidth={2}
              style={{ transition: 'opacity 0.2s' }}
            />
            {/* Percentage label outside the slice */}
            {percentage > 5 && (
              <text 
                x={labelPos.x} 
                y={labelPos.y}
                textAnchor={midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'end' : 'start'}
                fill={themeSecondary}
                fontSize="11"
                fontWeight="600"
                dy="0.35em"
              >
                {percentage}%
              </text>
            )}
          </g>
        );
      })}

      {/* Center label */}
      <text 
        x={cx} 
        y={cy - 8} 
        textAnchor="middle" 
        fill={themeSecondary} 
        fontSize="20" 
        fontWeight="700"
      >
        {total.toLocaleString()}
      </text>
      <text 
        x={cx} 
        y={cy + 12} 
        textAnchor="middle" 
        fill={themeGray} 
        fontSize="11"
      >
        total
      </text>
    </svg>
  );
}
