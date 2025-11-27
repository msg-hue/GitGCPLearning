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
    if (p.status === 'sent') return '#d4edda';
    if (p.status === 'pending') return '#fff3cd';
    if (p.status === 'failed') return '#f8d7da';
    return '#e2e3e5';
  }};
  color: ${p => {
    if (p.status === 'sent') return '#155724';
    if (p.status === 'pending') return '#856404';
    if (p.status === 'failed') return '#721c24';
    return '#383d41';
  }};
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${p => p.theme.colors.lightGray};
  color: ${p => p.theme.colors.secondary};
`;

// Dummy data based on database structure
const reminderSummary = {
  totalSent: 1248,
  sentToday: 45,
  pending: 12,
  failed: 3
};

const reminders = [
  { 
    reminderId: 'REM001', 
    customerId: 'CUST001', 
    customerName: 'Ahmed Khan', 
    reminderDate: '2024-06-25',
    reminderType: 'Payment Due',
    status: 'sent',
    channel: 'Email',
    dueAmount: 45000,
    dueDate: '2024-07-15',
    message: 'Payment reminder for installment #5'
  },
  { 
    reminderId: 'REM002', 
    customerId: 'CUST002', 
    customerName: 'Fatima Ali', 
    reminderDate: '2024-06-25',
    reminderType: 'Payment Overdue',
    status: 'sent',
    channel: 'SMS',
    dueAmount: 38000,
    dueDate: '2024-06-20',
    message: 'Overdue payment notice - Please clear outstanding amount'
  },
  { 
    reminderId: 'REM003', 
    customerId: 'CUST003', 
    customerName: 'Hassan Malik', 
    reminderDate: '2024-06-26',
    reminderType: 'Payment Due',
    status: 'sent',
    channel: 'Email',
    dueAmount: 32000,
    dueDate: '2024-07-10',
    message: 'Upcoming payment due in 14 days'
  },
  { 
    reminderId: 'REM004', 
    customerId: 'CUST004', 
    customerName: 'Ayesha Sheikh', 
    reminderDate: '2024-06-26',
    reminderType: 'Payment Due',
    status: 'pending',
    channel: 'Email',
    dueAmount: 29500,
    dueDate: '2024-07-05',
    message: 'Payment reminder for installment #3'
  },
  { 
    reminderId: 'REM005', 
    customerId: 'CUST005', 
    customerName: 'Bilal Ahmed', 
    reminderDate: '2024-06-27',
    reminderType: 'Payment Due',
    status: 'sent',
    channel: 'SMS',
    dueAmount: 27500,
    dueDate: '2024-07-25',
    message: 'Friendly reminder: Payment due in 28 days'
  },
  { 
    reminderId: 'REM006', 
    customerId: 'CUST006', 
    customerName: 'Sara Hassan', 
    reminderDate: '2024-06-27',
    reminderType: 'Payment Confirmation',
    status: 'sent',
    channel: 'Email',
    dueAmount: 22000,
    dueDate: '2024-07-01',
    message: 'Payment confirmation for installment #2'
  },
  { 
    reminderId: 'REM007', 
    customerId: 'CUST007', 
    customerName: 'Omar Farooq', 
    reminderDate: '2024-06-24',
    reminderType: 'Payment Overdue',
    status: 'failed',
    channel: 'Email',
    dueAmount: 52000,
    dueDate: '2024-05-15',
    message: 'Urgent: Multiple overdue payments require attention'
  },
  { 
    reminderId: 'REM008', 
    customerId: 'CUST008', 
    customerName: 'Zainab Malik', 
    reminderDate: '2024-06-28',
    reminderType: 'Payment Due',
    status: 'pending',
    channel: 'SMS',
    dueAmount: 41000,
    dueDate: '2024-07-18',
    message: 'Payment reminder for installment #4'
  },
  { 
    reminderId: 'REM009', 
    customerId: 'CUST001', 
    customerName: 'Ahmed Khan', 
    reminderDate: '2024-06-20',
    reminderType: 'Payment Overdue',
    status: 'sent',
    channel: 'Email',
    dueAmount: 45000,
    dueDate: '2024-05-15',
    message: 'First reminder: Payment overdue by 35 days'
  },
  { 
    reminderId: 'REM010', 
    customerId: 'CUST002', 
    customerName: 'Fatima Ali', 
    reminderDate: '2024-06-22',
    reminderType: 'Payment Due',
    status: 'sent',
    channel: 'Email',
    dueAmount: 38000,
    dueDate: '2024-07-20',
    message: 'Payment reminder for installment #6'
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
 * AutomatedReminders
 * Purpose: AI & Automation → Automated Reminders with reminder records
 */
export default function AutomatedReminders() {
  return (
    <Wrap>
      <Title>Automated Reminders</Title>
      
      <SummaryCards>
        <Card>
          <CardLabel>Total Reminders Sent</CardLabel>
          <CardValue>{reminderSummary.totalSent.toLocaleString()}</CardValue>
          <CardChange positive>All time</CardChange>
        </Card>
        <Card>
          <CardLabel>Sent Today</CardLabel>
          <CardValue>{reminderSummary.sentToday}</CardValue>
          <CardChange positive>Active today</CardChange>
        </Card>
        <Card>
          <CardLabel>Pending</CardLabel>
          <CardValue>{reminderSummary.pending}</CardValue>
          <CardChange>Scheduled</CardChange>
        </Card>
        <Card>
          <CardLabel>Failed</CardLabel>
          <CardValue style={{ color: '#dc3545' }}>{reminderSummary.failed}</CardValue>
          <CardChange>Requires attention</CardChange>
        </Card>
      </SummaryCards>

      <Section>
        <SectionTitle>Recent Reminders</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>Reminder ID</Th>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Reminder Date</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Channel</Th>
              <Th>Due Amount</Th>
              <Th>Due Date</Th>
              <Th>Message</Th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder, idx) => (
              <Tr key={idx}>
                <Td>{reminder.reminderId}</Td>
                <Td>{reminder.customerId}</Td>
                <Td>{reminder.customerName}</Td>
                <Td>{reminder.reminderDate}</Td>
                <Td>
                  <TypeBadge>{reminder.reminderType}</TypeBadge>
                </Td>
                <Td>
                  <StatusBadge status={reminder.status}>
                    {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                  </StatusBadge>
                </Td>
                <Td>{reminder.channel}</Td>
                <Td>{formatCurrency(reminder.dueAmount)}</Td>
                <Td>{reminder.dueDate}</Td>
                <Td>{reminder.message}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Wrap>
  );
}
