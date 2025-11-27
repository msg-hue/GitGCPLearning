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

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const Select = styled.select`
  padding: 0.6rem 1rem;
  border: 1px solid ${p => p.theme.colors.lightGray};
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: 0.6rem 1rem;
  border: 1px solid ${p => p.theme.colors.lightGray};
  border-radius: 6px;
  font-size: 0.9rem;
  flex: 1;
  max-width: 300px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid ${p => p.theme.colors.lightGray};
  max-height: 600px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: ${props => props.theme.colors.lightGray};
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 2px solid ${props => props.theme.colors.secondary};
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.lightGray};
  color: ${props => props.theme.colors.secondary};
  white-space: nowrap;
`;

const Tr = styled.tr`
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background: ${props => {
    if (props.status === 'Available') return '#e8f5e9';
    if (props.status === 'Allotted') return '#fff3e0';
    if (props.status === 'Sold') return '#ffebee';
    return '#f5f5f5';
  }};
  color: ${props => {
    if (props.status === 'Available') return '#2e7d32';
    if (props.status === 'Allotted') return '#e65100';
    if (props.status === 'Sold') return '#c62828';
    return '#757575';
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.color || props.theme.colors.primary};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
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

const ExportButton = styled(RefreshButton)`
  background: #4caf50;
  
  &:hover {
    background: #45a049;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ProjectTable = styled(Table)`
  margin-top: 1rem;
`;

/**
 * InventoryStatus
 * Purpose: Property → Inventory Status report showing properties grid based on database schema.
 * Inputs: None (fetches inventory status from API).
 * Outputs: Renders inventory report with summary stats, project breakdown, and properties grid.
 */
export default function InventoryStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInventoryStatus();
      setData(response);
    } catch (err) {
      console.error('[InventoryStatus] Error loading data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = (data) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const exportToCSV = () => {
    if (!data || !data.properties) return;
    
    const headers = ['Property ID', 'Project ID', 'Plot No', 'Street', 'Plot Type', 'Block', 'Property Type', 'Size', 'Status', 'Created At', 'Additional Info'];
    const rows = filteredProperties.map(p => [
      p.propertyId || '',
      p.projectId || '',
      p.plotNo || '',
      p.street || '',
      p.plotType || '',
      p.block || '',
      p.propertyType || '',
      p.size || '',
      p.status || '',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      p.additionalInfo || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-status-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <Title>Inventory Status Report</Title>
        </Header>
        <Loading>Loading inventory data...</Loading>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Header>
          <Title>Inventory Status Report</Title>
        </Header>
        <Error>{error}</Error>
        <RefreshButton onClick={loadInventoryData}>Retry</RefreshButton>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <Header>
          <Title>Inventory Status Report</Title>
        </Header>
        <EmptyState>No data available</EmptyState>
      </PageContainer>
    );
  }

  const summary = data.summary || {};
  const projects = data.projects || [];
  const allProperties = data.properties || [];

  // Filter properties
  const filteredProperties = allProperties.filter(p => {
    const matchesStatus = statusFilter === 'All' || (p.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesProject = projectFilter === 'All' || (p.projectId || '') === projectFilter;
    const matchesSearch = !searchTerm || 
      (p.propertyId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.plotNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.block || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.plotType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesProject && matchesSearch;
  });

  const sortedProperties = sortedData(filteredProperties);

  // Get unique project IDs for filter
  const uniqueProjectIds = [...new Set(allProperties.map(p => p.projectId).filter(Boolean))];

  return (
    <PageContainer>
      <Header>
        <Title>Inventory Status Report</Title>
        <ButtonGroup>
          <ExportButton onClick={exportToCSV} disabled={!data || !data.properties || data.properties.length === 0}>
            Export CSV
          </ExportButton>
          <RefreshButton onClick={loadInventoryData} disabled={loading}>
            Refresh
          </RefreshButton>
        </ButtonGroup>
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

      {/* Project-wise Breakdown */}
      {projects.length > 0 && (
        <>
          <SectionTitle>Project Summary</SectionTitle>
          <TableContainer>
            <ProjectTable>
              <thead>
                <tr>
                  <Th>Project Name</Th>
                  <Th>Type</Th>
                  <Th>Location</Th>
                  <Th style={{ textAlign: 'right' }}>Total</Th>
                  <Th style={{ textAlign: 'right' }}>Available</Th>
                  <Th style={{ textAlign: 'right' }}>Allotted</Th>
                  <Th style={{ textAlign: 'right' }}>Sold</Th>
                  <Th style={{ textAlign: 'right', minWidth: '120px' }}>Utilization</Th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <Tr key={project.projectId || idx}>
                    <Td>
                      <strong>{project.projectName || 'N/A'}</strong>
                    </Td>
                    <Td>{project.type || '—'}</Td>
                    <Td>{project.location || '—'}</Td>
                    <Td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {project.total?.toLocaleString() || 0}
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <StatusBadge status="Available">{project.available?.toLocaleString() || 0}</StatusBadge>
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <StatusBadge status="Allotted">{project.allotted?.toLocaleString() || 0}</StatusBadge>
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <StatusBadge status="Sold">{project.sold?.toLocaleString() || 0}</StatusBadge>
                    </Td>
                    <Td style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div>{project.utilizationRate || 0}%</div>
                      <ProgressBar>
                        <ProgressFill 
                          percentage={parseFloat(project.utilizationRate || 0)} 
                          color={parseFloat(project.utilizationRate || 0) > 80 ? '#4caf50' : parseFloat(project.utilizationRate || 0) > 50 ? '#ff9800' : '#f44336'}
                        />
                      </ProgressBar>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </ProjectTable>
          </TableContainer>
        </>
      )}

      {/* Properties Grid */}
      <SectionTitle>
        Properties Grid ({filteredProperties.length} of {allProperties.length} properties)
      </SectionTitle>
      
      <FilterSection>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Available">Available</option>
          <option value="Allotted">Allotted</option>
          <option value="Sold">Sold</option>
        </Select>
        <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {uniqueProjectIds.map(projectId => (
            <option key={projectId} value={projectId}>{projectId}</option>
          ))}
        </Select>
        <Input
          type="text"
          placeholder="Search by Property ID, Plot No, Block, Size, Street..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FilterSection>

      {sortedProperties.length === 0 ? (
        <EmptyState>No properties found matching the filters.</EmptyState>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th onClick={() => handleSort('propertyId')} style={{ cursor: 'pointer' }}>
                  Property ID {sortConfig.key === 'propertyId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('projectId')} style={{ cursor: 'pointer' }}>
                  Project ID {sortConfig.key === 'projectId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('plotNo')} style={{ cursor: 'pointer' }}>
                  Plot No {sortConfig.key === 'plotNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('street')} style={{ cursor: 'pointer' }}>
                  Street {sortConfig.key === 'street' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('plotType')} style={{ cursor: 'pointer' }}>
                  Plot Type {sortConfig.key === 'plotType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('block')} style={{ cursor: 'pointer' }}>
                  Block {sortConfig.key === 'block' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('propertyType')} style={{ cursor: 'pointer' }}>
                  Property Type {sortConfig.key === 'propertyType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
                  Size {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                  Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th>Additional Info</Th>
              </tr>
            </thead>
            <tbody>
              {sortedProperties.map((property, idx) => (
                <Tr key={property.propertyId || idx}>
                  <Td><strong>{property.propertyId || '—'}</strong></Td>
                  <Td>{property.projectId || '—'}</Td>
                  <Td>{property.plotNo || '—'}</Td>
                  <Td>{property.street || '—'}</Td>
                  <Td>{property.plotType || '—'}</Td>
                  <Td>{property.block || '—'}</Td>
                  <Td>{property.propertyType || '—'}</Td>
                  <Td>{property.size || '—'}</Td>
                  <Td>
                    <StatusBadge status={property.status || 'Unknown'}>
                      {property.status || 'Unknown'}
                    </StatusBadge>
                  </Td>
                  <Td>
                    {property.createdAt 
                      ? new Date(property.createdAt).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td title={property.additionalInfo || ''} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {property.additionalInfo 
                      ? (property.additionalInfo.length > 30 
                          ? property.additionalInfo.substring(0, 30) + '...' 
                          : property.additionalInfo)
                      : '—'}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
}
