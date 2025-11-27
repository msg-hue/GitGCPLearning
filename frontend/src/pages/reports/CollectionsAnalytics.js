import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
`;

const Title = styled.h1`
  margin: 0 0 1.5rem 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.5rem;
  font-weight: 600;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${p => p.theme.colors.lightGray};
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CardLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const CardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${p => p.theme.colors.secondary};
`;

const CardChange = styled.div`
  font-size: 0.75rem;
  color: ${p => p.positive ? '#28a745' : '#dc3545'};
  margin-top: 0.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  color: ${p => p.theme.colors.secondary};
  margin-bottom: 1rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Th = styled.th`
  background: ${p => p.theme.colors.lightGray};
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  color: ${p => p.theme.colors.secondary};
  border-bottom: 2px solid ${p => p.theme.colors.secondary};
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.lightGray};
  font-size: 0.9rem;
`;

const Tr = styled.tr`
  &:hover {
    background: ${p => p.theme.colors.lightGray};
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${p => p.status === 'active' ? '#d4edda' : p.status === 'inactive' ? '#f8d7da' : '#fff3cd'};
  color: ${p => p.status === 'active' ? '#155724' : p.status === 'inactive' ? '#721c24' : '#856404'};
`;

// Dummy data
const connectionStats = {
  totalConnections: 1248,
  activeConnections: 1089,
  inactiveConnections: 159,
  connectionRate: 87.3
};

const connectionData = [
  { month: 'January 2024', total: 1150, active: 1002, inactive: 148, new: 45 },
  { month: 'February 2024', total: 1180, active: 1035, inactive: 145, new: 38 },
  { month: 'March 2024', total: 1205, active: 1058, inactive: 147, new: 42 },
  { month: 'April 2024', total: 1220, active: 1072, inactive: 148, new: 35 },
  { month: 'May 2024', total: 1235, active: 1080, inactive: 155, new: 40 },
  { month: 'June 2024', total: 1248, active: 1089, inactive: 159, new: 33 },
];

const connectionDetails = [
  { connectionId: 'CONN001', customerId: 'CUST001', customerName: 'Ahmed Khan', status: 'active', connectionDate: '2023-01-15', type: 'Residential' },
  { connectionId: 'CONN002', customerId: 'CUST002', customerName: 'Fatima Ali', status: 'active', connectionDate: '2023-02-20', type: 'Commercial' },
  { connectionId: 'CONN003', customerId: 'CUST003', customerName: 'Hassan Malik', status: 'active', connectionDate: '2023-03-10', type: 'Residential' },
  { connectionId: 'CONN004', customerId: 'CUST004', customerName: 'Ayesha Sheikh', status: 'inactive', connectionDate: '2022-11-05', type: 'Residential' },
  { connectionId: 'CONN005', customerId: 'CUST005', customerName: 'Bilal Ahmed', status: 'active', connectionDate: '2023-04-18', type: 'Commercial' },
  { connectionId: 'CONN006', customerId: 'CUST006', customerName: 'Sara Hassan', status: 'pending', connectionDate: '2024-06-01', type: 'Residential' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * CollectionsAnalytics
 * Purpose: Reports → Collections Analytics (Connection Analysis) with dummy data
 */
export default function CollectionsAnalytics() {
  return (
    <Wrap>
      <Title>Collections Analytics</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Connections</CardLabel>
          <CardValue>{connectionStats.totalConnections.toLocaleString()}</CardValue>
          <CardChange positive>+13 new this month</CardChange>
        </Card>
        <Card>
          <CardLabel>Active Connections</CardLabel>
          <CardValue>{connectionStats.activeConnections.toLocaleString()}</CardValue>
          <CardChange positive>{connectionStats.connectionRate}% active rate</CardChange>
        </Card>
        <Card>
          <CardLabel>Inactive Connections</CardLabel>
          <CardValue>{connectionStats.inactiveConnections.toLocaleString()}</CardValue>
          <CardChange>12.7% of total</CardChange>
        </Card>
        <Card>
          <CardLabel>Connection Rate</CardLabel>
          <CardValue>{connectionStats.connectionRate}%</CardValue>
          <CardChange positive>+2.1% vs last month</CardChange>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Connection Analysis by Month</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th>Total Connections</Th>
              <Th>Active</Th>
              <Th>Inactive</Th>
              <Th>New Connections</Th>
            </tr>
          </thead>
          <tbody>
            {connectionData.map((row, idx) => (
              <Tr key={idx}>
                <Td>{row.month}</Td>
                <Td>{row.total.toLocaleString()}</Td>
                <Td>{row.active.toLocaleString()}</Td>
                <Td>{row.inactive.toLocaleString()}</Td>
                <Td>{row.new}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <SectionTitle>Connection Details</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Connection ID</Th>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Status</Th>
              <Th>Connection Date</Th>
              <Th>Type</Th>
            </tr>
          </thead>
          <tbody>
            {connectionDetails.map((conn, idx) => (
              <Tr key={idx}>
                <Td>{conn.connectionId}</Td>
                <Td>{conn.customerId}</Td>
                <Td>{conn.customerName}</Td>
                <Td>
                  <StatusBadge status={conn.status}>
                    {conn.status.charAt(0).toUpperCase() + conn.status.slice(1)}
                  </StatusBadge>
                </Td>
                <Td>{conn.connectionDate}</Td>
                <Td>{conn.type}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
