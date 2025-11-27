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

const RiskBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${p => {
    if (p.risk === 'high') return '#f8d7da';
    if (p.risk === 'medium') return '#fff3cd';
    return '#d4edda';
  }};
  color: ${p => {
    if (p.risk === 'high') return '#721c24';
    if (p.risk === 'medium') return '#856404';
    return '#155724';
  }};
`;

const ScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${p => p.theme.colors.lightGray};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.25rem;
`;

const ScoreFill = styled.div`
  height: 100%;
  background: ${p => {
    if (p.score >= 70) return '#dc3545';
    if (p.score >= 40) return '#ffc107';
    return '#28a745';
  }};
  width: ${p => p.score}%;
  transition: width 0.3s ease;
`;

// Dummy data based on database structure
const scoringSummary = {
  totalCustomers: 342,
  highRisk: 28,
  mediumRisk: 95,
  lowRisk: 219
};

const customerScores = [
  { 
    customerId: 'CUST001', 
    customerName: 'Ahmed Khan', 
    riskScore: 78, 
    riskLevel: 'high',
    overduePayments: 3,
    overdueAmount: 45000,
    predictedDelay: '15-20 days',
    lastPaymentDate: '2024-04-15',
    paymentHistory: 'Irregular'
  },
  { 
    customerId: 'CUST002', 
    customerName: 'Fatima Ali', 
    riskScore: 65, 
    riskLevel: 'high',
    overduePayments: 2,
    overdueAmount: 38000,
    predictedDelay: '10-15 days',
    lastPaymentDate: '2024-05-01',
    paymentHistory: 'Delayed'
  },
  { 
    customerId: 'CUST003', 
    customerName: 'Hassan Malik', 
    riskScore: 52, 
    riskLevel: 'medium',
    overduePayments: 1,
    overdueAmount: 32000,
    predictedDelay: '5-10 days',
    lastPaymentDate: '2024-05-20',
    paymentHistory: 'Occasional delays'
  },
  { 
    customerId: 'CUST004', 
    customerName: 'Ayesha Sheikh', 
    riskScore: 45, 
    riskLevel: 'medium',
    overduePayments: 1,
    overdueAmount: 29500,
    predictedDelay: '3-7 days',
    lastPaymentDate: '2024-05-25',
    paymentHistory: 'Mostly on time'
  },
  { 
    customerId: 'CUST005', 
    customerName: 'Bilal Ahmed', 
    riskScore: 35, 
    riskLevel: 'low',
    overduePayments: 0,
    overdueAmount: 0,
    predictedDelay: '0-3 days',
    lastPaymentDate: '2024-06-10',
    paymentHistory: 'On time'
  },
  { 
    customerId: 'CUST006', 
    customerName: 'Sara Hassan', 
    riskScore: 28, 
    riskLevel: 'low',
    overduePayments: 0,
    overdueAmount: 0,
    predictedDelay: '0-2 days',
    lastPaymentDate: '2024-06-15',
    paymentHistory: 'Always on time'
  },
  { 
    customerId: 'CUST007', 
    customerName: 'Omar Farooq', 
    riskScore: 82, 
    riskLevel: 'high',
    overduePayments: 4,
    overdueAmount: 52000,
    predictedDelay: '20-25 days',
    lastPaymentDate: '2024-03-10',
    paymentHistory: 'Frequently delayed'
  },
  { 
    customerId: 'CUST008', 
    customerName: 'Zainab Malik', 
    riskScore: 58, 
    riskLevel: 'medium',
    overduePayments: 2,
    overdueAmount: 41000,
    predictedDelay: '8-12 days',
    lastPaymentDate: '2024-05-15',
    paymentHistory: 'Inconsistent'
  },
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
 * LeadScoring
 * Purpose: AI & Automation → Lead Scoring with customer risk scores and payment predictions
 */
export default function LeadScoring() {
  return (
    <Wrap>
      <Title>Lead Scoring - Customer Risk Analysis</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Customers Analyzed</CardLabel>
          <CardValue>{scoringSummary.totalCustomers}</CardValue>
        </Card>
        <Card>
          <CardLabel>High Risk Customers</CardLabel>
          <CardValue style={{ color: '#dc3545' }}>{scoringSummary.highRisk}</CardValue>
        </Card>
        <Card>
          <CardLabel>Medium Risk Customers</CardLabel>
          <CardValue style={{ color: '#ffc107' }}>{scoringSummary.mediumRisk}</CardValue>
        </Card>
        <Card>
          <CardLabel>Low Risk Customers</CardLabel>
          <CardValue style={{ color: '#28a745' }}>{scoringSummary.lowRisk}</CardValue>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Customer Risk Scores & Payment Predictions</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Risk Score</Th>
              <Th>Risk Level</Th>
              <Th>Overdue Payments</Th>
              <Th>Overdue Amount</Th>
              <Th>Predicted Delay</Th>
              <Th>Last Payment</Th>
              <Th>Payment History</Th>
            </tr>
          </thead>
          <tbody>
            {customerScores.map((customer, idx) => (
              <Tr key={idx}>
                <Td>{customer.customerId}</Td>
                <Td>{customer.customerName}</Td>
                <Td>
                  <div>{customer.riskScore}/100</div>
                  <ScoreBar>
                    <ScoreFill score={customer.riskScore} />
                  </ScoreBar>
                </Td>
                <Td>
                  <RiskBadge risk={customer.riskLevel}>
                    {customer.riskLevel.toUpperCase()}
                  </RiskBadge>
                </Td>
                <Td>{customer.overduePayments}</Td>
                <Td>{customer.overdueAmount > 0 ? formatCurrency(customer.overdueAmount) : '—'}</Td>
                <Td>{customer.predictedDelay}</Td>
                <Td>{customer.lastPaymentDate}</Td>
                <Td>{customer.paymentHistory}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
