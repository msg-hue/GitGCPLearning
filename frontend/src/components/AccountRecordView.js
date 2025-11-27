import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getAccountRecordByPlanId } from '../utils/api';

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
  min-width: 900px;
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

const PlanInfo = styled.div`
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
  min-width: 150px;
`;

const SummaryCard = styled.div`
  background: #f8f9fa;
  border: 1px solid ${props => props.theme.colors.lightGray};
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const SummaryValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.secondary};
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
 * AccountRecordView
 * Purpose: Display account record for a payment plan with all schedule entries.
 * Inputs:
 *  - planId: string payment plan identifier
 *  - onClose: function to close the modal
 * Outputs:
 *  - Renders a modal with account record table showing all schedule entries
 */
export default function AccountRecordView({ planId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accountRecord, setAccountRecord] = useState(null);

  useEffect(() => {
    const fetchAccountRecord = async () => {
      if (!planId) {
        setError('Plan ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getAccountRecordByPlanId(planId);
        setAccountRecord(data);
      } catch (err) {
        setError(err.message || 'Failed to load account record');
        console.error('Error loading account record:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountRecord();
  }, [planId]);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Account Record - Payment Plan</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {loading && <Loading>Loading account record...</Loading>}

        {error && <Error>{error}</Error>}

        {!loading && !error && accountRecord && (
          <>
            <PlanInfo>
              <InfoRow>
                <InfoLabel>Plan ID:</InfoLabel>
                <span>{accountRecord.PlanId || planId}</span>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Plan Name:</InfoLabel>
                <span>{accountRecord.PlanName || '—'}</span>
              </InfoRow>
              {accountRecord.ProjectId && (
                <InfoRow>
                  <InfoLabel>Project ID:</InfoLabel>
                  <span>{accountRecord.ProjectId}</span>
                </InfoRow>
              )}
              {accountRecord.TotalAmount && (
                <InfoRow>
                  <InfoLabel>Total Amount:</InfoLabel>
                  <span>{formatCurrency(accountRecord.TotalAmount)}</span>
                </InfoRow>
              )}
              {accountRecord.DurationMonths && (
                <InfoRow>
                  <InfoLabel>Duration:</InfoLabel>
                  <span>{accountRecord.DurationMonths} months</span>
                </InfoRow>
              )}
              {accountRecord.Frequency && (
                <InfoRow>
                  <InfoLabel>Frequency:</InfoLabel>
                  <span>{accountRecord.Frequency}</span>
                </InfoRow>
              )}
            </PlanInfo>

            {accountRecord.Summary && (
              <>
                <SectionTitle>Account Summary</SectionTitle>
                <SummaryCard>
                  <SummaryItem>
                    <SummaryLabel>Total Schedules</SummaryLabel>
                    <SummaryValue>{accountRecord.Summary.TotalSchedules || 0}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Total Due Amount</SummaryLabel>
                    <SummaryValue>{formatCurrency(accountRecord.Summary.TotalDueAmount)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Total Surcharge</SummaryLabel>
                    <SummaryValue>{formatCurrency(accountRecord.Summary.TotalSurchargeAmount)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Grand Total</SummaryLabel>
                    <SummaryValue>{formatCurrency(accountRecord.Summary.GrandTotal)}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Pending Schedules</SummaryLabel>
                    <SummaryValue>{accountRecord.Summary.PendingSchedules || 0}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>Overdue Schedules</SummaryLabel>
                    <SummaryValue>{accountRecord.Summary.OverdueSchedules || 0}</SummaryValue>
                  </SummaryItem>
                </SummaryCard>
              </>
            )}

            <SectionTitle>Payment Schedule Entries</SectionTitle>
            
            {accountRecord.ScheduleEntries && accountRecord.ScheduleEntries.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Schedule ID</Th>
                    <Th>Scheduled Payment</Th>
                    <Th>Installment #</Th>
                    <Th>Due Date</Th>
                    <Th>Due Amount</Th>
                    <Th>Surcharge</Th>
                    <Th>Total Due</Th>
                  </tr>
                </thead>
                <tbody>
                  {accountRecord.ScheduleEntries.map((entry, index) => (
                    <tr key={entry.ScheduleId || index}>
                      <Td>{entry.ScheduleId || '—'}</Td>
                      <Td>{entry.PaymentDescription || '—'}</Td>
                      <Td>{entry.InstallmentNo ?? '—'}</Td>
                      <Td>{formatDate(entry.DueDate)}</Td>
                      <Td>{formatCurrency(entry.DueAmount)}</Td>
                      <Td>
                        {entry.SurchargeApplied 
                          ? `${entry.SurchargeRate ?? 0}%` 
                          : '—'}
                      </Td>
                      <Td>{formatCurrency(entry.TotalDueAmount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyMessage>No payment schedule entries found for this plan.</EmptyMessage>
            )}
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

