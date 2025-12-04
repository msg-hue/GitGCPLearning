import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  getCustomer,
  getPayments,
  deletePayment,
} from '../../utils/api';

const Wrap = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
`;
const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Title = styled.h1`
  margin: 0 0 0.5rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.2rem;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;
const Button = styled.button`
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-family: 'Lexend', sans-serif;
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`;
const SearchCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 1rem;
  margin-bottom: 1rem;
`;
const SearchRow = styled.div`
  display: grid;
  grid-template-columns: 240px 120px;
  gap: 0.5rem;
  align-items: end;
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;
const Label = styled.label`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.secondary};
  margin-bottom: 0.25rem;
  display: block;
`;
const Input = styled.input`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-family: 'Lexend', sans-serif;
  width: 100%;
`;
const CustomerSummary = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  border: 1px solid rgba(0, 35, 76, 0.12);
  border-radius: 6px;
  background: rgba(0, 35, 76, 0.03);
  color: ${p => p.theme.colors.secondary};
`;
const Grid = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  overflow: hidden;
`;
const Th = styled.th`
  text-align: left;
  padding: 0.6rem 0.75rem;
  background: rgba(0,35,76,0.06);
  color: ${p => p.theme.colors.secondary};
  font-weight: 600;
`;
const Td = styled.td`
  padding: 0.6rem 0.75rem;
  border-top: 1px solid #eee;
  color: ${p => p.theme.colors.secondary};
`;
const TableActions = styled.div`
  display: flex;
  gap: 0.35rem;
`;
const SecondaryButton = styled(Button)`
  background: #5c6c80;
`;
const DangerButton = styled(Button)`
  background: #c62828;
`;
const Message = styled.div`
  margin: 0.5rem 0;
  color: ${p => p.color || '#b00020'};
`;
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalCard = styled.div`
  width: 560px;
  max-width: 92vw;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.18);
  padding: 1rem;
  font-family: 'Lexend', sans-serif;
`;
const ModalTitle = styled.h3`
  margin: 0 0 0.75rem;
  color: ${p => p.theme.colors.secondary};
`;
const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

// Note: ModalOverlay, ModalCard, ModalTitle, ModalActions are still used for delete confirmation

const normalizePayment = (p) => {
  const paymentId = p.paymentId ?? p.PaymentId ?? p.paymentid;
  const customerId = p.customerId ?? p.CustomerId ?? p.customerid;
  const paymentDate = p.paymentDate ?? p.PaymentDate ?? p.paymentdate;
  const amount = p.amount ?? p.Amount;
  const method = p.method ?? p.Method;
  const referenceNo = p.referenceNo ?? p.ReferenceNo ?? p.referenceno;
  const status = p.status ?? p.Status;
  const remarks = p.remarks ?? p.Remarks ?? p.description ?? p.Description;
  return {
    paymentId,
    customerId,
    paymentDate,
    amount,
    method,
    referenceNo,
    status,
    remarks,
    raw: p,
  };
};

/**
 * Collections
 * Purpose: Payments collections CRUD tied to customers/payments table.
 */
export default function Collections() {
  const navigate = useNavigate();
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [notice, setNotice] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const selectedCustomerId = useMemo(() => (
    selectedCustomer?.customerId ??
    selectedCustomer?.CustomerId ??
    selectedCustomer?.customerid ??
    ''
  ), [selectedCustomer]);

  const selectedCustomerName = useMemo(() => (
    selectedCustomer?.fullName ??
    selectedCustomer?.FullName ??
    selectedCustomer?.fullname ??
    ''
  ), [selectedCustomer]);

  const handleSearch = async () => {
    const id = String(customerInput || '').trim();
    if (!id) {
      setSearchError('Customer ID is required');
      return;
    }
    setSearching(true);
    setSearchError('');
    setPayments([]);
    setPaymentsError('');
    setNotice('');
    try {
      const customer = await getCustomer(id);
      setSelectedCustomer(customer);
      await fetchPayments(id);
    } catch (e) {
      setSelectedCustomer(null);
      setSearchError(e.message || 'Customer not found');
    } finally {
      setSearching(false);
    }
  };

  const fetchPayments = async (customerId) => {
    const id = customerId || selectedCustomerId;
    if (!id) return;
    setLoadingPayments(true);
    setPaymentsError('');
    try {
      const res = await getPayments({ customerId: id, page: 1, pageSize: 1000 });
      const data = res.data ?? res;
      const list = Array.isArray(data) ? data.map(normalizePayment) : [];
      setPayments(list);
    } catch (e) {
      setPayments([]);
      setPaymentsError(e.message || 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  /**
   * openAdd - Navigate to the create payment page
   */
  const openAdd = () => {
    if (!selectedCustomerId) {
      setSearchError('Search for a customer before creating payments');
      return;
    }
    navigate(`/payments/collections/new?customerId=${selectedCustomerId}`);
  };

  /**
   * openEdit - Navigate to the edit payment page
   */
  const openEdit = (payment) => {
    const norm = normalizePayment(payment);
    const id = String(norm.paymentId || '').trim();
    if (!id) return;
    navigate(`/payments/collections/${id}/edit`);
  };

  /**
   * openView - Navigate to the view payment page (for double-click)
   */
  const openView = (payment) => {
    const norm = normalizePayment(payment);
    const id = String(norm.paymentId || '').trim();
    if (!id) return;
    navigate(`/payments/collections/${id}`);
  };

  const confirmDelete = (payment) => {
    const norm = normalizePayment(payment);
    setDeleteTarget(norm);
    setDeleteError('');
    setConfirmingDelete(true);
  };

  const performDelete = async () => {
    if (!deleteTarget?.paymentId) {
      setDeleteError('Missing payment ID');
      return;
    }
    setSaving(true);
    setDeleteError('');
    try {
      await deletePayment(deleteTarget.paymentId);
      setConfirmingDelete(false);
      setNotice('Payment deleted successfully');
      await fetchPayments();
    } catch (e) {
      setDeleteError(e.message || 'Failed to delete payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <TitleRow>
        <Actions>
          <Button onClick={openAdd} disabled={!selectedCustomerId}>Add Payment</Button>
          <Button onClick={() => fetchPayments()} disabled={!selectedCustomerId || loadingPayments}>Refresh</Button>
        </Actions>
      </TitleRow>
      <SearchCard>
        <Label htmlFor="customerSearch">Customer ID</Label>
        <SearchRow>
          <Input
            id="customerSearch"
            placeholder="e.g., CUST0001"
            value={customerInput}
            onChange={e => setCustomerInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </SearchRow>
        {searchError && <Message>{searchError}</Message>}
        {selectedCustomer && (
          <CustomerSummary>
            <strong>{selectedCustomerName || 'Unnamed Customer'}</strong>
            <div>ID: {selectedCustomerId}</div>
            <div>Email: {selectedCustomer?.email ?? selectedCustomer?.Email ?? '-'}</div>
            <div>Phone: {selectedCustomer?.phone ?? selectedCustomer?.Phone ?? '-'}</div>
          </CustomerSummary>
        )}
      </SearchCard>

      {notice && <Message color="#0a7f3f">{notice}</Message>}
      {paymentsError && <Message>{paymentsError}</Message>}

      <Grid>
        <thead>
          <tr>
            <Th>Payment ID</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Method</Th>
            <Th>Status</Th>
            <Th>Reference</Th>
            <Th>Remarks</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loadingPayments ? (
            <tr><Td colSpan={8}>Loading…</Td></tr>
          ) : payments.length === 0 ? (
            <tr><Td colSpan={8}>No payments found. Search for a customer to get started.</Td></tr>
          ) : (
            payments.map(payment => (
              <tr 
                key={payment.paymentId}
                onDoubleClick={() => openView(payment)}
                style={{ cursor: 'pointer' }}
                title="Double-click to view details"
              >
                <Td>{payment.paymentId}</Td>
                <Td>{payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : '-'}</Td>
                <Td>{payment.amount ?? '-'}</Td>
                <Td>{payment.method ?? '-'}</Td>
                <Td>{payment.status ?? '-'}</Td>
                <Td>{payment.referenceNo ?? '-'}</Td>
                <Td>{payment.remarks ?? '-'}</Td>
                <Td>
                  <TableActions>
                    <SecondaryButton onClick={(e) => { e.stopPropagation(); openEdit(payment); }}>Edit</SecondaryButton>
                    <DangerButton onClick={(e) => { e.stopPropagation(); confirmDelete(payment); }}>Delete</DangerButton>
                  </TableActions>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Grid>

      {confirmingDelete && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Delete Payment</ModalTitle>
            {deleteError && <Message>{deleteError}</Message>}
            <p>Are you sure you want to delete payment <strong>{deleteTarget?.paymentId}</strong>?</p>
            <ModalActions>
              <Button onClick={() => setConfirmingDelete(false)} style={{ background: '#777' }}>Cancel</Button>
              <DangerButton onClick={performDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </DangerButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrap>
  );
}