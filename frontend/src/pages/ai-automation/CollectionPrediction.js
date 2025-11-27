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

const ConfidenceBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${p => {
    if (p.confidence >= 80) return '#d4edda';
    if (p.confidence >= 60) return '#fff3cd';
    return '#f8d7da';
  }};
  color: ${p => {
    if (p.confidence >= 80) return '#155724';
    if (p.confidence >= 60) return '#856404';
    return '#721c24';
  }};
`;

const ChartContainer = styled.div`
  background: white;
  border: 1px solid ${p => p.theme.colors.lightGray};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ChartBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const ChartLabel = styled.div`
  min-width: 150px;
  font-size: 0.9rem;
  color: ${p => p.theme.colors.secondary};
`;

const ChartBarFill = styled.div`
  flex: 1;
  height: 30px;
  background: ${p => p.theme.colors.lightGray};
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ChartBarValue = styled.div`
  height: 100%;
  background: ${p => p.theme.colors.primary};
  width: ${p => p.percentage}%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  transition: width 0.3s ease;
`;

// Dummy data based on database structure
const predictionSummary = {
  totalPredicted: 1250000,
  highConfidence: 980000,
  mediumConfidence: 220000,
  lowConfidence: 50000,
  predictionMonth: 'July 2024'
};

const predictionsByCustomer = [
  { 
    customerId: 'CUST001', 
    customerName: 'Ahmed Khan', 
    planId: 'PP0000001',
    predictedAmount: 45000,
    confidence: 75,
    dueDate: '2024-07-15',
    paymentMethod: 'Bank Transfer'
  },
  { 
    customerId: 'CUST002', 
    customerName: 'Fatima Ali', 
    planId: 'PP0000002',
    predictedAmount: 38000,
    confidence: 82,
    dueDate: '2024-07-20',
    paymentMethod: 'Cash'
  },
  { 
    customerId: 'CUST003', 
    customerName: 'Hassan Malik', 
    planId: 'PP0000003',
    predictedAmount: 32000,
    confidence: 88,
    dueDate: '2024-07-10',
    paymentMethod: 'Cheque'
  },
  { 
    customerId: 'CUST004', 
    customerName: 'Ayesha Sheikh', 
    planId: 'PP0000004',
    predictedAmount: 29500,
    confidence: 92,
    dueDate: '2024-07-05',
    paymentMethod: 'Bank Transfer'
  },
  { 
    customerId: 'CUST005', 
    customerName: 'Bilal Ahmed', 
    planId: 'PP0000005',
    predictedAmount: 27500,
    confidence: 85,
    dueDate: '2024-07-25',
    paymentMethod: 'Online Payment'
  },
  { 
    customerId: 'CUST006', 
    customerName: 'Sara Hassan', 
    planId: 'PP0000006',
    predictedAmount: 22000,
    confidence: 95,
    dueDate: '2024-07-01',
    paymentMethod: 'Bank Transfer'
  },
];

const predictionsByPlan = [
  { 
    planId: 'PP0000001', 
    planName: 'Monthly Installment Plan', 
    totalPredicted: 450000,
    customerCount: 12,
    avgAmount: 37500
  },
  { 
    planId: 'PP0000002', 
    planName: 'Quarterly Payment Plan', 
    totalPredicted: 320000,
    customerCount: 8,
    avgAmount: 40000
  },
  { 
    planId: 'PP0000003', 
    planName: 'Bi-Annual Plan', 
    totalPredicted: 280000,
    customerCount: 6,
    avgAmount: 46667
  },
  { 
    planId: 'PP0000004', 
    planName: 'Annual Payment Plan', 
    totalPredicted: 200000,
    customerCount: 4,
    avgAmount: 50000
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

const maxAmount = Math.max(...predictionsByPlan.map(p => p.totalPredicted));

/**
 * CollectionPrediction
 * Purpose: AI & Automation → Collection Prediction with predicted amounts for upcoming month
 */
export default function CollectionPrediction() {
  return (
    <Wrap>
      <Title>Collection Prediction - {predictionSummary.predictionMonth}</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Predicted Collections</CardLabel>
          <CardValue>{formatCurrency(predictionSummary.totalPredicted)}</CardValue>
          <CardChange positive>+8.5% vs last month</CardChange>
        </Card>
        <Card>
          <CardLabel>High Confidence Predictions</CardLabel>
          <CardValue>{formatCurrency(predictionSummary.highConfidence)}</CardValue>
          <CardChange positive>78.4% of total</CardChange>
        </Card>
        <Card>
          <CardLabel>Medium Confidence</CardLabel>
          <CardValue>{formatCurrency(predictionSummary.mediumConfidence)}</CardValue>
          <CardChange>17.6% of total</CardChange>
        </Card>
        <Card>
          <CardLabel>Low Confidence</CardLabel>
          <CardValue>{formatCurrency(predictionSummary.lowConfidence)}</CardValue>
          <CardChange>4.0% of total</CardChange>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Predicted Collections by Payment Plan</SectionTitle>
        <ChartContainer>
          {predictionsByPlan.map((plan, idx) => (
            <ChartBar key={idx}>
              <ChartLabel>{plan.planName} ({plan.planId})</ChartLabel>
              <ChartBarFill>
                <ChartBarValue percentage={(plan.totalPredicted / maxAmount) * 100}>
                  {formatCurrency(plan.totalPredicted)}
                </ChartBarValue>
              </ChartBarFill>
            </ChartBar>
          ))}
        </ChartContainer>
      </Section>

      <Section>
        <SectionTitle>Predicted Collections by Customer</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Plan ID</Th>
              <Th>Predicted Amount</Th>
              <Th>Confidence</Th>
              <Th>Due Date</Th>
              <Th>Payment Method</Th>
            </tr>
          </thead>
          <tbody>
            {predictionsByCustomer.map((prediction, idx) => (
              <Tr key={idx}>
                <Td>{prediction.customerId}</Td>
                <Td>{prediction.customerName}</Td>
                <Td>{prediction.planId}</Td>
                <Td>{formatCurrency(prediction.predictedAmount)}</Td>
                <Td>
                  <ConfidenceBadge confidence={prediction.confidence}>
                    {prediction.confidence}%
                  </ConfidenceBadge>
                </Td>
                <Td>{prediction.dueDate}</Td>
                <Td>{prediction.paymentMethod}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <SectionTitle>Predicted Collections by Plan</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Plan ID</Th>
              <Th>Plan Name</Th>
              <Th>Total Predicted</Th>
              <Th>Customer Count</Th>
              <Th>Average Amount</Th>
            </tr>
          </thead>
          <tbody>
            {predictionsByPlan.map((plan, idx) => (
              <Tr key={idx}>
                <Td>{plan.planId}</Td>
                <Td>{plan.planName}</Td>
                <Td>{formatCurrency(plan.totalPredicted)}</Td>
                <Td>{plan.customerCount}</Td>
                <Td>{formatCurrency(plan.avgAmount)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
