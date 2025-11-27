import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getInventoryStatus } from '../../utils/api';

const PageContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  font-family: 'Lexend', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
  color: ${p => p.theme.colors.secondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${props => props.bgColor || '#f7f9fc'};
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.secondary};
  opacity: 0.8;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.color || props.theme.colors.secondary};
`;

const SectionTitle = styled.h3`
  margin: 2rem 0 1rem 0;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${p => p.theme.colors.secondary};
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${p => p.theme.colors.lightGray};
`;

const MatrixContainer = styled.div`
  overflow-x: auto;
  margin-top: 2rem;
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
  border: 1px solid ${p => p.theme.colors.lightGray};
`;

const MatrixTh = styled.th`
  text-align: ${props => props.align || 'center'};
  padding: 1rem;
  background: ${props => props.theme.colors.secondary};
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid ${props => props.theme.colors.lightGray};
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
`;

const MatrixTd = styled.td`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.theme.colors.lightGray};
  text-align: center;
  color: ${props => props.theme.colors.secondary};
`;

const MatrixTr = styled.tr`
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ProjectNameCell = styled(MatrixTd)`
  text-align: left;
  font-weight: 600;
  background: #f8f9fa;
  position: sticky;
  left: 0;
  z-index: 5;
`;

const CountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  background: ${props => {
    if (props.count === 0) return '#f5f5f5';
    if (props.variant === 'total') return '#e3f2fd';
    if (props.variant === 'available') return '#e8f5e9';
    if (props.variant === 'allotted') return '#fff3e0';
    if (props.variant === 'sold') return '#ffebee';
    return '#f5f5f5';
  }};
  color: ${props => {
    if (props.count === 0) return '#9e9e9e';
    if (props.variant === 'total') return '#1976d2';
    if (props.variant === 'available') return '#2e7d32';
    if (props.variant === 'allotted') return '#e65100';
    if (props.variant === 'sold') return '#c62828';
    return '#757575';
  }};
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.1rem;
`;

const Error = styled.div`
  padding: 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #c62828;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${p => p.theme.colors.secondary};
  opacity: 0.7;
  font-size: 1rem;
`;

const RefreshButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: ${p => p.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${p => p.theme.colors.primaryDark || p.theme.colors.primary};
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  align-items: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const LegendColor = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => props.color};
`;

/**
 * AvailabilityMatrix
 * Purpose: Property → Availability Matrix showing property availability in a matrix format by project and status.
 * Inputs: None (fetches inventory status from API).
 * Outputs: Renders a matrix view of property availability across projects.
 */
export default function AvailabilityMatrix() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatrixData();
  }, []);

  const loadMatrixData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInventoryStatus();
      setData(response);
    } catch (err) {
      console.error('[AvailabilityMatrix] Error loading data:', err);
      setError(err.message || 'Failed to load matrix data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <Title>Availability Matrix</Title>
        </Header>
        <Loading>Loading availability matrix...</Loading>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Header>
          <Title>Availability Matrix</Title>
        </Header>
        <Error>{error}</Error>
        <RefreshButton onClick={loadMatrixData}>Retry</RefreshButton>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <Header>
          <Title>Availability Matrix</Title>
        </Header>
        <EmptyState>No data available</EmptyState>
      </PageContainer>
    );
  }

  const summary = data.summary || {};
  const projects = data.projects || [];

  return (
    <PageContainer>
      <Header>
        <Title>Availability Matrix</Title>
        <RefreshButton onClick={loadMatrixData} disabled={loading}>
          Refresh
        </RefreshButton>
      </Header>

      {/* Summary Statistics */}
      <StatsGrid>
        <StatCard bgColor="#e3f2fd">
          <StatLabel>Total Properties</StatLabel>
          <StatValue color="#1976d2">{summary.totalProperties?.toLocaleString() || 0}</StatValue>
        </StatCard>
        <StatCard bgColor="#e8f5e9">
          <StatLabel>Available</StatLabel>
          <StatValue color="#2e7d32">{summary.availableProperties?.toLocaleString() || 0}</StatValue>
        </StatCard>
        <StatCard bgColor="#fff3e0">
          <StatLabel>Allotted</StatLabel>
          <StatValue color="#e65100">{summary.allottedProperties?.toLocaleString() || 0}</StatValue>
        </StatCard>
        <StatCard bgColor="#ffebee">
          <StatLabel>Sold</StatLabel>
          <StatValue color="#c62828">{summary.soldProperties?.toLocaleString() || 0}</StatValue>
        </StatCard>
      </StatsGrid>

      {/* Availability Matrix */}
      <SectionTitle>Project-wise Availability Matrix</SectionTitle>

      {projects.length === 0 ? (
        <EmptyState>No project data available</EmptyState>
      ) : (
        <>
          <MatrixContainer>
            <MatrixTable>
              <thead>
                <tr>
                  <MatrixTh align="left" rowSpan="2">Project Name</MatrixTh>
                  <MatrixTh align="left" rowSpan="2">Type</MatrixTh>
                  <MatrixTh align="left" rowSpan="2">Location</MatrixTh>
                  <MatrixTh colSpan="4">Availability Status</MatrixTh>
                  <MatrixTh rowSpan="2">Utilization %</MatrixTh>
                </tr>
                <tr>
                  <MatrixTh>Total</MatrixTh>
                  <MatrixTh>Available</MatrixTh>
                  <MatrixTh>Allotted</MatrixTh>
                  <MatrixTh>Sold</MatrixTh>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <MatrixTr key={project.projectId || idx}>
                    <ProjectNameCell>
                      <strong>{project.projectName || 'N/A'}</strong>
                    </ProjectNameCell>
                    <MatrixTd style={{ textAlign: 'left' }}>{project.type || '—'}</MatrixTd>
                    <MatrixTd style={{ textAlign: 'left' }}>{project.location || '—'}</MatrixTd>
                    <MatrixTd>
                      <CountBadge count={project.total || 0} variant="total">
                        {project.total?.toLocaleString() || 0}
                      </CountBadge>
                    </MatrixTd>
                    <MatrixTd>
                      <CountBadge count={project.available || 0} variant="available">
                        {project.available?.toLocaleString() || 0}
                      </CountBadge>
                    </MatrixTd>
                    <MatrixTd>
                      <CountBadge count={project.allotted || 0} variant="allotted">
                        {project.allotted?.toLocaleString() || 0}
                      </CountBadge>
                    </MatrixTd>
                    <MatrixTd>
                      <CountBadge count={project.sold || 0} variant="sold">
                        {project.sold?.toLocaleString() || 0}
                      </CountBadge>
                    </MatrixTd>
                    <MatrixTd>
                      <strong>{project.utilizationRate || 0}%</strong>
                    </MatrixTd>
                  </MatrixTr>
                ))}
                {/* Total Row */}
                <MatrixTr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                  <ProjectNameCell style={{ background: '#e0e0e0' }}>
                    <strong>TOTAL</strong>
                  </ProjectNameCell>
                  <MatrixTd colSpan="2" style={{ background: '#e0e0e0' }}>—</MatrixTd>
                  <MatrixTd>
                    <CountBadge count={summary.totalProperties || 0} variant="total">
                      {summary.totalProperties?.toLocaleString() || 0}
                    </CountBadge>
                  </MatrixTd>
                  <MatrixTd>
                    <CountBadge count={summary.availableProperties || 0} variant="available">
                      {summary.availableProperties?.toLocaleString() || 0}
                    </CountBadge>
                  </MatrixTd>
                  <MatrixTd>
                    <CountBadge count={summary.allottedProperties || 0} variant="allotted">
                      {summary.allottedProperties?.toLocaleString() || 0}
                    </CountBadge>
                  </MatrixTd>
                  <MatrixTd>
                    <CountBadge count={summary.soldProperties || 0} variant="sold">
                      {summary.soldProperties?.toLocaleString() || 0}
                    </CountBadge>
                  </MatrixTd>
                  <MatrixTd>
                    <strong>
                      {summary.totalProperties > 0
                        ? Math.round(((summary.allottedProperties || 0) + (summary.soldProperties || 0)) / summary.totalProperties * 100)
                        : 0}%
                    </strong>
                  </MatrixTd>
                </MatrixTr>
              </tbody>
            </MatrixTable>
          </MatrixContainer>

          {/* Legend */}
          <Legend>
            <strong>Legend:</strong>
            <LegendItem>
              <LegendColor color="#e3f2fd" />
              <span>Total Properties</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#e8f5e9" />
              <span>Available</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#fff3e0" />
              <span>Allotted</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#ffebee" />
              <span>Sold</span>
            </LegendItem>
          </Legend>
        </>
      )}
    </PageContainer>
  );
}