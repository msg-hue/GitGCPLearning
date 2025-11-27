import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getCustomerStatement } from '../utils/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  overflow-y: auto;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 800px;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid ${props => props.theme.colors.lightGray};
  padding-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: ${props => props.theme.colors.secondary};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.secondary};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const CustomerInfo = styled.div`
  background: ${props => props.theme.colors.lightGray};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.strong`
  color: ${props => props.theme.colors.secondary};
  min-width: 120px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem;
  background: ${props => props.theme.colors.lightGray};
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 2px solid ${props => props.theme.colors.secondary};
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.lightGray};
  font-size: 0.85rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.colors.secondary};
`;

const Error = styled.div`
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin: 1rem 0;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.colors.secondary};
  font-style: italic;
`;

const SectionTitle = styled.h3`
  margin: 1.5rem 0 1rem 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.lightGray};
  padding-bottom: 0.5rem;
`;

const SummaryCard = styled.div`
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const SummaryItem = styled.div`
  text-align: center;
  
  .label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: ${props => props.color || props.theme.colors.secondary};
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'Paid') return '#d4edda';
    if (props.status === 'Partial') return '#fff3cd';
    return '#f8d7da';
  }};
  color: ${props => {
    if (props.status === 'Paid') return '#155724';
    if (props.status === 'Partial') return '#856404';
    return '#721c24';
  }};
`;

const OutstandingCell = styled.span`
  font-weight: ${props => props.outstanding > 0 ? '600' : 'normal'};
  color: ${props => props.outstanding > 0 ? '#dc3545' : '#28a745'};
`;

const formatDate = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(date);
  }
};

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Consolidates payment schedules with payment history
 * Matches payments to schedules by ScheduleId
 */
const consolidatePaymentData = (schedules = [], payments = []) => {
  // Create a map of schedule ID to payments
  const paymentsByScheduleId = {};
  payments.forEach(payment => {
    const scheduleId = payment.ScheduleId || payment.scheduleId;
    if (scheduleId) {
      const key = scheduleId.trim();
      if (!paymentsByScheduleId[key]) {
        paymentsByScheduleId[key] = [];
      }
      paymentsByScheduleId[key].push(payment);
    }
  });

  // Consolidate each schedule with its payments
  return schedules.map(schedule => {
    const scheduleId = (schedule.ScheduleId || schedule.scheduleId || '').trim();
    const matchedPayments = paymentsByScheduleId[scheduleId] || [];
    
    // Calculate total paid for this schedule
    const totalPaid = matchedPayments.reduce((sum, p) => {
      const amount = parseFloat(p.Amount || p.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const dueAmount = parseFloat(schedule.DueAmount || schedule.dueAmount || 0);
    const outstanding = Math.max(0, dueAmount - totalPaid);
    
    // Get the most recent payment info
    const latestPayment = matchedPayments.length > 0 
      ? matchedPayments.sort((a, b) => 
          new Date(b.PaymentDate || b.paymentDate) - new Date(a.PaymentDate || a.paymentDate)
        )[0]
      : null;

    return {
      scheduleId: scheduleId,
      scheduledPayment: schedule.ScheduledPayment || schedule.PaymentDescription || schedule.paymentDescription || '—',
      dueAmount: dueAmount,
      dueDate: schedule.DueDate || schedule.dueDate,
      installmentNo: schedule.InstallmentNo ?? schedule.installmentNo ?? '—',
      paymentAmount: totalPaid > 0 ? totalPaid : null,
      paymentMethod: latestPayment?.Method || latestPayment?.method || null,
      paymentDate: latestPayment?.PaymentDate || latestPayment?.paymentDate || null,
      outstanding: outstanding,
      status: outstanding === 0 && totalPaid > 0 ? 'Paid' : 
              totalPaid > 0 && outstanding > 0 ? 'Partial' : 'Unpaid',
      payments: matchedPayments
    };
  });
};

/**
 * CustomerStatement
 * Purpose: Display customer account statement with payment schedules.
 * Inputs:
 *  - customerId: string customer identifier
 *  - onClose: function to close the modal
 * Outputs:
 *  - Renders a modal with statement table showing Scheduled Payment, Due Amount, Due Date
 */
export default function CustomerStatement({ customerId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statement, setStatement] = useState(null);

  useEffect(() => {
    const fetchStatement = async () => {
      if (!customerId) {
        setError('Customer ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getCustomerStatement(customerId);
        setStatement(data);
      } catch (err) {
        setError(err.message || 'Failed to load customer statement');
        console.error('Error loading statement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [customerId]);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Account Statement</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {loading && <Loading>Loading statement...</Loading>}

        {error && <Error>{error}</Error>}

        {!loading && !error && statement && (
          <>
            <CustomerInfo>
              <InfoRow>
                <InfoLabel>Customer ID:</InfoLabel>
                <span>{statement.CustomerId || customerId}</span>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Customer Name:</InfoLabel>
                <span>{statement.CustomerName || '—'}</span>
              </InfoRow>
              {statement.PlanId && (
                <InfoRow>
                  <InfoLabel>Payment Plan ID:</InfoLabel>
                  <span>{statement.PlanId}</span>
                </InfoRow>
              )}
            </CustomerInfo>

            {(() => {
              const consolidated = consolidatePaymentData(statement.Schedules, statement.Payments);
              const totalDue = consolidated.reduce((sum, c) => sum + c.dueAmount, 0);
              const totalPaid = consolidated.reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
              const totalOutstanding = consolidated.reduce((sum, c) => sum + c.outstanding, 0);
              const paidCount = consolidated.filter(c => c.status === 'Paid').length;
              
              return (
                <>
                  <SummaryCard>
                    <SummaryItem>
                      <div className="label">Total Due</div>
                      <div className="value">{formatCurrency(totalDue)}</div>
                    </SummaryItem>
                    <SummaryItem color="#28a745">
                      <div className="label">Total Paid</div>
                      <div className="value">{formatCurrency(totalPaid)}</div>
                    </SummaryItem>
                    <SummaryItem color={totalOutstanding > 0 ? '#dc3545' : '#28a745'}>
                      <div className="label">Outstanding</div>
                      <div className="value">{formatCurrency(totalOutstanding)}</div>
                    </SummaryItem>
                    <SummaryItem>
                      <div className="label">Progress</div>
                      <div className="value">{paidCount} / {consolidated.length}</div>
                    </SummaryItem>
                  </SummaryCard>

                  <SectionTitle>Consolidated Payment Statement</SectionTitle>
                  
                  {consolidated.length > 0 ? (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Scheduled Payment</Th>
                          <Th>Due Amount</Th>
                          <Th>Due Date</Th>
                          <Th>Inst. #</Th>
                          <Th>Payment Amount</Th>
                          <Th>Payment Method</Th>
                          <Th>Payment Date</Th>
                          <Th>Outstanding</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidated.map((row, index) => (
                          <tr key={row.scheduleId || index}>
                            <Td>{row.scheduledPayment}</Td>
                            <Td>{formatCurrency(row.dueAmount)}</Td>
                            <Td>{formatDate(row.dueDate)}</Td>
                            <Td>{row.installmentNo}</Td>
                            <Td>{row.paymentAmount ? formatCurrency(row.paymentAmount) : '—'}</Td>
                            <Td>{row.paymentMethod || '—'}</Td>
                            <Td>{row.paymentDate ? formatDate(row.paymentDate) : '—'}</Td>
                            <Td>
                              <OutstandingCell outstanding={row.outstanding}>
                                {formatCurrency(row.outstanding)}
                              </OutstandingCell>
                              {' '}
                              <StatusBadge status={row.status}>{row.status}</StatusBadge>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <EmptyMessage>No payment data found for this customer.</EmptyMessage>
                  )}
                </>
              );
            })()}
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

