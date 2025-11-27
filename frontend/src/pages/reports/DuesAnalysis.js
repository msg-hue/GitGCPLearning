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
  background: ${p => {
    if (p.status === 'overdue') return '#f8d7da';
    if (p.status === 'due-soon') return '#fff3cd';
    return '#d4edda';
  }};
  color: ${p => {
    if (p.status === 'overdue') return '#721c24';
    if (p.status === 'due-soon') return '#856404';
    return '#155724';
  }};
`;

// Dummy data
const duesSummary = {
  totalOutstanding: 2450000,
  overdueAmount: 850000,
  dueThisMonth: 420000,
  agingAverage: 45
};

const agingData = [
  { period: '0-30 days', amount: 1200000, count: 145, percentage: 49.0 },
  { period: '31-60 days', amount: 680000, count: 82, percentage: 27.8 },
  { period: '61-90 days', amount: 420000, count: 48, percentage: 17.1 },
  { period: '90+ days', amount: 150000, count: 18, percentage: 6.1 },
];

const overdueRecords = [
  { customerId: 'CUST001', customerName: 'Ahmed Khan', amount: 45000, dueDate: '2024-05-15', daysOverdue: 42, status: 'overdue' },
  { customerId: 'CUST002', customerName: 'Fatima Ali', amount: 38000, dueDate: '2024-05-22', daysOverdue: 35, status: 'overdue' },
  { customerId: 'CUST003', customerName: 'Hassan Malik', amount: 32000, dueDate: '2024-06-01', daysOverdue: 25, status: 'overdue' },
  { customerId: 'CUST004', customerName: 'Ayesha Sheikh', amount: 29500, dueDate: '2024-06-10', daysOverdue: 16, status: 'overdue' },
  { customerId: 'CUST005', customerName: 'Bilal Ahmed', amount: 27500, dueDate: '2024-06-20', daysOverdue: 6, status: 'due-soon' },
  { customerId: 'CUST006', customerName: 'Sara Hassan', amount: 22000, dueDate: '2024-07-01', daysOverdue: -5, status: 'current' },
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
 * DuesAnalysis
 * Purpose: Reports → Dues Analysis with dummy data
 */
export default function DuesAnalysis() {
  return (
    <Wrap>
      <Title>Dues Analysis</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Outstanding</CardLabel>
          <CardValue>{formatCurrency(duesSummary.totalOutstanding)}</CardValue>
          <CardChange>-5.2% vs last month</CardChange>
        </Card>
        <Card>
          <CardLabel>Overdue Amount</CardLabel>
          <CardValue>{formatCurrency(duesSummary.overdueAmount)}</CardValue>
          <CardChange>-8.1% vs last month</CardChange>
        </Card>
        <Card>
          <CardLabel>Due This Month</CardLabel>
          <CardValue>{formatCurrency(duesSummary.dueThisMonth)}</CardValue>
          <CardChange positive>On track</CardChange>
        </Card>
        <Card>
          <CardLabel>Average Aging (Days)</CardLabel>
          <CardValue>{duesSummary.agingAverage}</CardValue>
          <CardChange positive>-3 days improvement</CardChange>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Aging Analysis</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Aging Period</Th>
              <Th>Amount</Th>
              <Th>Count</Th>
              <Th>Percentage</Th>
            </tr>
          </thead>
          <tbody>
            {agingData.map((row, idx) => (
              <Tr key={idx}>
                <Td>{row.period}</Td>
                <Td>{formatCurrency(row.amount)}</Td>
                <Td>{row.count}</Td>
                <Td>{row.percentage}%</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <SectionTitle>Overdue Records</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Amount</Th>
              <Th>Due Date</Th>
              <Th>Days Overdue</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {overdueRecords.map((record, idx) => (
              <Tr key={idx}>
                <Td>{record.customerId}</Td>
                <Td>{record.customerName}</Td>
                <Td>{formatCurrency(record.amount)}</Td>
                <Td>{record.dueDate}</Td>
                <Td>{record.daysOverdue > 0 ? `${record.daysOverdue} days` : `${Math.abs(record.daysOverdue)} days remaining`}</Td>
                <Td>
                  <StatusBadge status={record.status}>
                    {record.status === 'overdue' ? 'Overdue' : record.status === 'due-soon' ? 'Due Soon' : 'Current'}
                  </StatusBadge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
