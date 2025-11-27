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

// Dummy data
const salesSummary = {
  totalSales: 12500000,
  monthlySales: 1050000,
  totalCustomers: 342,
  averageSale: 36550
};

const monthlyData = [
  { month: 'January 2024', sales: 1200000, customers: 28, avgSale: 42857 },
  { month: 'February 2024', sales: 1350000, customers: 32, avgSale: 42188 },
  { month: 'March 2024', sales: 1180000, customers: 30, avgSale: 39333 },
  { month: 'April 2024', sales: 1420000, customers: 35, avgSale: 40571 },
  { month: 'May 2024', sales: 1280000, customers: 31, avgSale: 41290 },
  { month: 'June 2024', sales: 1050000, customers: 27, avgSale: 38889 },
];

const topCustomers = [
  { customerId: 'CUST001', name: 'Ahmed Khan', totalSales: 450000, properties: 3, lastPurchase: '2024-05-15' },
  { customerId: 'CUST002', name: 'Fatima Ali', totalSales: 380000, properties: 2, lastPurchase: '2024-04-22' },
  { customerId: 'CUST003', name: 'Hassan Malik', totalSales: 320000, properties: 2, lastPurchase: '2024-06-10' },
  { customerId: 'CUST004', name: 'Ayesha Sheikh', totalSales: 295000, properties: 1, lastPurchase: '2024-03-18' },
  { customerId: 'CUST005', name: 'Bilal Ahmed', totalSales: 275000, properties: 1, lastPurchase: '2024-05-28' },
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
 * SalesAnalytics
 * Purpose: Reports → Sales Analytics with dummy data
 */
export default function SalesAnalytics() {
  return (
    <Wrap>
      <Title>Sales Analytics</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Sales</CardLabel>
          <CardValue>{formatCurrency(salesSummary.totalSales)}</CardValue>
          <CardChange positive>+12.5% vs last period</CardChange>
        </Card>
        <Card>
          <CardLabel>Monthly Sales</CardLabel>
          <CardValue>{formatCurrency(salesSummary.monthlySales)}</CardValue>
          <CardChange positive>+8.3% vs last month</CardChange>
        </Card>
        <Card>
          <CardLabel>Total Customers</CardLabel>
          <CardValue>{salesSummary.totalCustomers}</CardValue>
          <CardChange positive>+15 new this month</CardChange>
        </Card>
        <Card>
          <CardLabel>Average Sale</CardLabel>
          <CardValue>{formatCurrency(salesSummary.averageSale)}</CardValue>
          <CardChange positive>+5.2% vs average</CardChange>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Monthly Sales Summary</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th>Total Sales</Th>
              <Th>Customers</Th>
              <Th>Avg Sale per Customer</Th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, idx) => (
              <Tr key={idx}>
                <Td>{row.month}</Td>
                <Td>{formatCurrency(row.sales)}</Td>
                <Td>{row.customers}</Td>
                <Td>{formatCurrency(row.avgSale)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <SectionTitle>Top Customers</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Total Sales</Th>
              <Th>Properties</Th>
              <Th>Last Purchase</Th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((customer, idx) => (
              <Tr key={idx}>
                <Td>{customer.customerId}</Td>
                <Td>{customer.name}</Td>
                <Td>{formatCurrency(customer.totalSales)}</Td>
                <Td>{customer.properties}</Td>
                <Td>{customer.lastPurchase}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
