import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getPaymentPlans, createPaymentPlan } from '../../utils/api';

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
  font-size: 0.9rem;
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
  font-size: 0.8rem;
`;
const Td = styled.td`
  padding: 0.6rem 0.75rem;
  border-top: 1px solid #eee;
  color: ${p => p.theme.colors.secondary};
  font-size: 0.8rem;
`;
const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin: 0.75rem 0 1rem;
`;
const Input = styled.input`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-family: 'Lexend', sans-serif;
`;
const Pager = styled.div`
  display: none;
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
  width: 520px;
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
const ModalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  color: ${p => p.theme.colors.secondary};
  margin-bottom: 0.25rem;
`;
const ModalInput = styled.input`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  width: 100%;
  font-family: 'Lexend', sans-serif;
`;
const ModalTextarea = styled.textarea`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  width: 100%;
  min-height: 70px;
  font-family: 'Lexend', sans-serif;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

/**
 * PaymentPlans
 * Purpose: Display all Payment Plans in a single grid without pagination.
 * Inputs: None.
 * Outputs: Table rendering all payment plans fetched from `/api/PaymentPlans`.
 */
export default function PaymentPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    planName: '',
    totalAmount: '',
    durationMonths: '',
    frequency: '',
    description: '',
  });

  /**
   * fetchPlans
   * Purpose: Load all payment plans (no paging) and update grid state.
   * Inputs: None.
   * Outputs: Updates `plans` array and meta totalCount.
   */
  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all plans from DB (request large pageSize to avoid truncation)
      const res = await getPaymentPlans({ page: 1, pageSize: 1000 });
      const data = res.data ?? res;
      setPlans(Array.isArray(data) ? data : []);
      setMeta({
        totalCount: (res.totalCount ?? data.length ?? 0),
        totalPages: 1,
      });
    } catch (e) {
      setError(e.message || 'Failed to load payment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter(p => (
      String(p.planId ?? p.planid ?? p.PlanId ?? '').toLowerCase().includes(term) ||
      String(p.planName ?? p.PlanName ?? '').toLowerCase().includes(term) ||
      String(p.frequency ?? p.Frequency ?? '').toLowerCase().includes(term)
    ));
  }, [plans, search]);

  const openCreate = () => {
    setForm({
      planName: '',
      totalAmount: '',
      durationMonths: '',
      frequency: '',
      description: '',
    });
    setCreateError('');
    setNotice('');
    setCreateOpen(true);
  };

  const savePlan = async () => {
    const name = String(form.planName || '').trim();
    if (!name) {
      setCreateError('Plan name is required');
      return;
    }
    if (form.totalAmount === '' || Number.isNaN(Number(form.totalAmount))) {
      setCreateError('Total amount must be a valid number');
      return;
    }

    setSaving(true);
    setCreateError('');
    try {
      const payload = {
        PlanName: name,
        TotalAmount: Number(form.totalAmount),
        DurationMonths: form.durationMonths === '' ? null : Number(form.durationMonths),
        Frequency: form.frequency || null,
        Description: String(form.description || '').trim() || null,
      };
      await createPaymentPlan(payload);
      setNotice('Payment plan created successfully');
      setCreateOpen(false);
      await fetchPlans();
    } catch (e) {
      setCreateError(e.message || 'Failed to create payment plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <TitleRow>
        <Actions>
          <Button onClick={openCreate}>Create Plan</Button>
          <Button onClick={fetchPlans} disabled={loading}>Refresh</Button>
        </Actions>
      </TitleRow>

      <Toolbar>
        <Input placeholder="Search by ID/Name/Frequency" value={search} onChange={e => setSearch(e.target.value)} />
      </Toolbar>

      {notice && <div style={{ color: '#0a7f3f', marginBottom: '0.5rem' }}>{notice}</div>}
      {error && <div style={{ color: '#b00020', marginBottom: '0.5rem' }}>{error}</div>}

      <Grid>
        <thead>
          <tr>
            <Th>Plan ID</Th>
            <Th>Name</Th>
            <Th>Total Amount</Th>
            <Th>Duration (months)</Th>
            <Th>Frequency</Th>
            <Th>Description</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
            
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><Td colSpan={9}>Loading...</Td></tr>
          ) : filtered.length === 0 ? (
            <tr><Td colSpan={9}>No payment plans found</Td></tr>
          ) : (
            filtered.map((p, i) => {
              const planId = p.planId ?? p.planid ?? p.PlanId;
              const planName = p.planName ?? p.PlanName;
              // Map schema differences: totalamount/durationmonths in user schema
              const totalAmount = p.totalamount ?? p.totalAmount ?? p.TotalAmount ?? p.installmentAmount ?? p.InstallmentAmount;
              const durationMonths = p.durationmonths ?? p.durationMonths ?? p.DurationMonths ?? p.totalInstallments ?? p.TotalInstallments;
              const freq = p.frequency ?? p.Frequency;
              const desc = p.description ?? p.Description;
              const created = p.createdat ?? p.createdAt ?? p.CreatedAt;
              
              return (
                <tr key={planId || i}>
                  <Td>{planId}</Td>
                  <Td>{planName}</Td>
                  <Td>{totalAmount ?? '-'}</Td>
                  <Td>{durationMonths ?? '-'}</Td>
                  <Td>{freq ?? '-'}</Td>
                  <Td>{desc ?? '-'}</Td>
                  <Td>{created ? String(created).slice(0,10) : '-'}</Td>
                  <Td>
                    <Button onClick={() => navigate(`/schedule/payment-plans/${encodeURIComponent(String(planId || '').trim())}`)}>
                      View Details
                    </Button>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Grid>

      <Pager />

      {createOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Create Payment Plan</ModalTitle>
            {createError && <div style={{ color: '#b00020', marginBottom: '0.5rem' }}>{createError}</div>}
            <ModalRow>
              <div>
                <Label>Plan Name</Label>
                <ModalInput value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} />
              </div>
              <div>
                <Label>Total Amount</Label>
                <ModalInput type="number" step="0.01" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} />
              </div>
            </ModalRow>
            <ModalRow>
              <div>
                <Label>Duration (months)</Label>
                <ModalInput type="number" value={form.durationMonths} onChange={e => setForm({ ...form, durationMonths: e.target.value })} />
              </div>
              <div>
                <Label>Frequency</Label>
                <ModalInput value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder="e.g., Monthly" />
              </div>
            </ModalRow>
            <div>
              <Label>Description</Label>
              <ModalTextarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <ModalActions>
              <Button onClick={() => setCreateOpen(false)} style={{ background: '#777' }}>Cancel</Button>
              <Button onClick={savePlan} disabled={saving}>{saving ? 'Saving…' : 'Create Plan'}</Button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrap>
  );
}