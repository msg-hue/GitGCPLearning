import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { getPaymentSchedules, updatePaymentSchedule, createPaymentSchedule } from '../../utils/api';

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
  width: 640px;
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
  min-height: 80px;
  font-family: 'Lexend', sans-serif;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;
const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 180px 180px 160px 1fr;
  gap: 0.5rem;
  margin: 0.75rem 0 1rem;
`;
const Input = styled.input`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-family: 'Lexend', sans-serif;
`;
const Select = styled.select`
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-family: 'Lexend', sans-serif;
`;

// Accordion styles (Twistee)
const GroupWrap = styled.div`
  margin: 0.5rem 0 1rem;
  border-radius: 8px;
  overflow: hidden;
`;
const GroupHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border: none;
  cursor: pointer;
  background: ${p => p.open ? p.theme.colors.secondary : 'rgba(0,35,76,0.06)'};
  color: ${p => p.open ? '#fff' : p.theme.colors.secondary};
  font-family: 'Lexend', sans-serif;
`;
const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const Caret = styled.span`
  display: inline-block;
  transition: transform 0.2s ease;
  transform: rotate(${p => (p.open ? 90 : 0)}deg);
`;
const GroupCount = styled.span`
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border-radius: 12px;
  padding: 0.15rem 0.5rem;
  font-size: 0.8rem;
`;
const GroupBody = styled.div`
  background: #fff;
  border-left: 3px solid ${p => p.theme.colors.primary};
`;

/**
 * PaymentSchedules
 * Purpose: Display child Payment Schedules grid, optionally filtered by Plan ID.
 * Inputs: None.
 * Outputs: Table of payment schedules fetched from `/api/PaymentSchedules`.
 */
/**
 * PaymentSchedules
 * Purpose: Display child Payment Schedules grid, optionally filtered by Plan ID.
 * Inputs:
 *  - defaultPlanId: optional string to pre-fill Plan ID filter
 * Outputs:
 *  - Table of payment schedules fetched from `/api/PaymentSchedules`.
 */
/**
 * PaymentSchedules
 * Purpose: Display Payment Schedules with two views: flat grid and grouped accordion (twistee).
 * Inputs:
 *  - defaultPlanId: optional string to pre-fill Plan ID filter
 * Outputs:
 *  - Interactive table or grouped accordion, backed by `/api/PaymentSchedules`.
 */
export default function PaymentSchedules({ defaultPlanId = '' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [planId, setPlanId] = useState(defaultPlanId || '');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 0 });
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'table'
  const [groupBy, setGroupBy] = useState('plan'); // 'plan' | 'month' | 'surcharge'
  const [openGroups, setOpenGroups] = useState(() => new Set());
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInstNo, setFormInstNo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formSurchargeApplied, setFormSurchargeApplied] = useState(false);
  const [formSurchargeRate, setFormSurchargeRate] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addInstNo, setAddInstNo] = useState('');
  const [addDueDate, setAddDueDate] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addSurchargeApplied, setAddSurchargeApplied] = useState(true);
  const [addSurchargeRate, setAddSurchargeRate] = useState('0.05');
  const [addNote, setAddNote] = useState('');

  /**
   * fetchRows
   * Purpose: Load one page of payment schedules for table view.
   * Inputs: uses `page`, `pageSize`, `planId` state
   * Outputs: updates `rows` and `meta` for paged rendering
   */
  const fetchRows = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      // Sanitize Plan ID to avoid whitespace mismatches
      const res = await getPaymentSchedules({ page, pageSize, planId: String(planId || '').trim() });
      const data = res.data ?? res;
      setRows(Array.isArray(data) ? data : []);
      setMeta({
        totalCount: res.totalCount ?? data.length ?? 0,
        totalPages: res.totalPages ?? 1,
      });
    } catch (e) {
      setError(e.message || 'Failed to load payment schedules');
    } finally {
      setLoading(false);
    }
  };

  /**
   * fetchRowsAll
   * Purpose: Load all pages of payment schedules for grouped (accordion) view
   * Inputs: uses `planId` state; ignores `page` for complete aggregation
   * Outputs: aggregates `rows` across all pages; sets meta.totalCount
   */
  const fetchRowsAll = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const sanitizedPlanId = String(planId || '').trim();
      // Request a larger page size to minimize round-trips; backend caps if needed
      const initial = await getPaymentSchedules({ page: 1, pageSize: 100, planId: sanitizedPlanId });
      const first = initial.data ?? initial;
      let all = Array.isArray(first) ? first.slice() : [];
      const totalPages = typeof initial.totalPages === 'number' ? initial.totalPages : 1;

      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= totalPages; p += 1) {
          promises.push(getPaymentSchedules({ page: p, pageSize: 100, planId: sanitizedPlanId }));
        }
        const results = await Promise.all(promises);
        results.forEach(res => {
          const d = res.data ?? res;
          if (Array.isArray(d)) all = all.concat(d);
        });
      }

      setRows(all);
      setMeta({
        totalCount: typeof initial.totalCount === 'number' ? initial.totalCount : all.length,
        totalPages: 1,
      });
    } catch (e) {
      setError(e.message || 'Failed to load payment schedules');
    } finally {
      setLoading(false);
    }
  };

  // Load data according to view mode: grouped aggregates all pages; table uses paging
  useEffect(() => {
    if (viewMode === 'grouped') {
      fetchRowsAll();
    } else {
      fetchRows();
    }
  }, [viewMode, page, pageSize, planId]);
  useEffect(() => { setPlanId(String(defaultPlanId || '').trim()); }, [defaultPlanId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const sched = String(r.scheduleid ?? r.ScheduleId ?? r.scheduleId ?? '').toLowerCase();
      const plan = String(r.planid ?? r.PlanId ?? r.planId ?? '').toLowerCase();
      const desc = String(r.paymentdescription ?? r.PaymentDescription ?? r.paymentDescription ?? '').toLowerCase();
      return sched.includes(term) || plan.includes(term) || desc.includes(term);
    });
  }, [rows, search]);

  /**
   * normalizeRow
   * Purpose: Normalize API row keys to a consistent shape for UI logic.
   * Inputs: r (raw row from API)
   * Outputs: { scheduleId, planId, description, installmentNo, dueDate, amount, surchargeApplied, surchargeRate, note }
   */
  const normalizeRow = (r) => {
    const scheduleId = r.scheduleid ?? r.ScheduleId ?? r.scheduleId;
    const pId = r.planid ?? r.PlanId ?? r.planId;
    const desc = r.paymentdescription ?? r.PaymentDescription ?? r.paymentDescription;
    const instNo = r.installmentno ?? r.InstallmentNo ?? r.installmentNo;
    const due = r.duedate ?? r.DueDate ?? r.dueDate;
    const amt = r.amount ?? r.Amount ?? r.installmentAmount ?? r.InstallmentAmount ?? r.totalAmount ?? r.TotalAmount;
    const sApplied = r.surchargeapplied ?? r.SurchargeApplied ?? r.surchargeApplied;
    const sRate = r.surchargerate ?? r.SurchargeRate ?? r.surchargeRate;
    const note = r.description ?? r.Description ?? r.note ?? r.Note ?? r.notes ?? r.Notes;
    return {
      scheduleId: String(scheduleId || ''),
      planId: String(pId || ''),
      description: desc ?? '-',
      installmentNo: instNo ?? '-',
      dueDate: due ? String(due).slice(0, 10) : '-',
      amount: amt ?? '-',
      surchargeApplied: sApplied,
      surchargeRate: sRate ?? '-',
      note: note ?? '-',
      raw: r,
    };
  };

  /**
   * deriveGroupKey
   * Purpose: Produce the grouping key and label based on selected grouping.
   * Inputs: row (normalized row)
   * Outputs: { key, label }
   */
  const deriveGroupKey = (row) => {
    switch (groupBy) {
      case 'month': {
        // Use YYYY-MM from dueDate
        const dStr = row.dueDate && row.dueDate !== '-' ? row.dueDate : '';
        const label = dStr ? dStr.slice(0, 7) : 'No Due Date';
        return { key: `month:${label}`, label };
      }
      case 'surcharge': {
        const applied = Boolean(row.surchargeApplied);
        const label = applied ? 'Surcharge Applied' : 'No Surcharge';
        return { key: `surcharge:${applied}`, label };
      }
      case 'plan':
      default: {
        const p = row.planId.trim() || 'Unassigned Plan';
        return { key: `plan:${p}`, label: p };
      }
    }
  };

  /**
   * groupedData
   * Purpose: Build grouped sections for the accordion view.
   * Inputs: filtered rows, groupBy selection
   * Outputs: Array of { key, label, items: normalizedRows }
   */
  const groupedData = useMemo(() => {
    const groups = new Map();
    filtered.forEach(r => {
      const nr = normalizeRow(r);
      const { key, label } = deriveGroupKey(nr);
      if (!groups.has(key)) groups.set(key, { key, label, items: [] });
      groups.get(key).items.push(nr);
    });
    // Optional sort: by label ascending
    return Array.from(groups.values()).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [filtered, groupBy]);

  // openEdit
  // Purpose: Populate modal with selected row data and open it.
  // Inputs: r (row object from grid)
  // Outputs: Sets edit form state and opens the modal.
  const openEdit = (r) => {
    const scheduleId = r.scheduleid ?? r.ScheduleId ?? r.scheduleId;
    const desc = r.paymentdescription ?? r.PaymentDescription ?? r.paymentDescription;
    const instNo = r.installmentno ?? r.InstallmentNo ?? r.installmentNo;
    const due = r.duedate ?? r.DueDate ?? r.dueDate;
    const amt = r.amount ?? r.Amount ?? r.installmentAmount ?? r.InstallmentAmount ?? r.totalAmount ?? r.TotalAmount;
    const surchargeApplied = r.surchargeapplied ?? r.SurchargeApplied ?? r.surchargeApplied;
    const surchargeRate = r.surchargerate ?? r.SurchargeRate ?? r.surchargeRate;
    const note = r.description ?? r.Description ?? r.note ?? r.Note ?? r.notes ?? r.Notes;

    setEditScheduleId(String(scheduleId || ''));
    setFormDesc(String(desc || ''));
    setFormInstNo(instNo ?? '');
    // Normalize date to yyyy-mm-dd for input[type=date]
    const d = due ? new Date(due) : null;
    const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10) : '';
    setFormDueDate(yyyyMmDd);
    setFormAmount(amt ?? '');
    setFormSurchargeApplied(Boolean(surchargeApplied));
    setFormSurchargeRate(surchargeRate ?? '');
    setFormNote(String(note || ''));
    setEditOpen(true);
  };

  // openAdd
  // Purpose: Open a blank modal to create a new schedule for the current Plan ID.
  // Inputs: none
  // Outputs: Resets add form state and opens the modal.
  const openAdd = () => {
    setAddDesc('');
    setAddInstNo('');
    setAddDueDate('');
    setAddAmount('');
    setAddSurchargeApplied(true);
    setAddSurchargeRate('0.05');
    setAddNote('');
    setAddError('');
    setAddOpen(true);
    setError('');
    setNotice('');
  };

  // saveEdit
  // Purpose: Persist changes via API and refresh grid.
  // Inputs: none (uses form state)
  // Outputs: Calls updatePaymentSchedule with ScheduleId, closes modal automatically,
          //          shows success notice on completion, and reloads grid rows.
  const saveEdit = async () => {
    const id = String(editScheduleId || '').trim();
    if (!id) {
      setError('Missing Schedule ID for update');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Backend requires path id to equal payload.ScheduleId
      // Use PascalCase keys to align with API model binding
      const payload = {
        ScheduleId: id,
        PlanId: String(planId || '').trim(),
        PaymentDescription: String(formDesc || '').trim() || null,
        InstallmentNo: formInstNo === '' ? null : Number(formInstNo),
        // Send yyyy-mm-dd string from date input; backend binds to DateTime?
        DueDate: formDueDate || null,
        Amount: formAmount === '' ? null : Number(formAmount),
        SurchargeApplied: Boolean(formSurchargeApplied),
        SurchargeRate: formSurchargeRate === '' ? null : Number(formSurchargeRate),
        Description: (String(formNote || '').trim()) || null,
      };
      await updatePaymentSchedule(id, payload);
      setEditOpen(false);
      setNotice('Schedule updated successfully');
      await fetchRows();
    } catch (e) {
      // Auto-close the modal even on error and surface message above grid
      setEditOpen(false);
      setError(e.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  // saveAdd
  // Purpose: Persist a new schedule via API and refresh grid.
  // Inputs: none (uses add form state)
  // Outputs: Creates schedule under the current Plan ID, closes modal, shows success notice, and reloads grid rows.
  const saveAdd = async () => {
    const pId = String(planId || '').trim();
    if (!pId) {
      setAddError('Plan ID is required to create a schedule');
      return;
    }
    // Basic validation to avoid common 400/DbUpdate errors
    if (!addDueDate) {
      setAddError('Due Date is required');
      return;
    }
    if (addAmount === '' || Number.isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
      setAddError('Amount must be a positive number');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      const payload = {
        PlanId: pId,
        PaymentDescription: String(addDesc || '').trim() || null,
        InstallmentNo: addInstNo === '' ? null : Number(addInstNo),
        DueDate: addDueDate || null,
        Amount: addAmount === '' ? null : Number(addAmount),
        SurchargeApplied: Boolean(addSurchargeApplied),
        SurchargeRate: addSurchargeRate === '' ? null : Number(addSurchargeRate),
        Description: (String(addNote || '').trim()) || null,
      };
      await createPaymentSchedule(payload);
      setAddOpen(false);
      setNotice('Schedule created successfully');
      await fetchRows();
    } catch (e) {
      // Keep modal open and show inline error for immediate feedback
      setAddError(e.message || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <TitleRow>
        <Title>Schedule: Payment Schedules</Title>
        <Actions>
          <Button onClick={viewMode === 'grouped' ? fetchRowsAll : fetchRows} disabled={loading}>Refresh</Button>
          <Button onClick={openAdd} disabled={loading}>Add</Button>
        </Actions>
      </TitleRow>

      <Toolbar>
        <Input placeholder="Filter by Plan ID (e.g., PLAN001)" value={planId} onChange={e => setPlanId(e.target.value)} />
        <Input placeholder="Search description or Schedule ID" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Select aria-label="View Mode" value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value="grouped">Grouped</option>
            <option value="table">Table</option>
          </Select>
          {viewMode === 'grouped' && (
            <Select aria-label="Group By" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="plan">Group by Plan</option>
              <option value="month">Group by Due Month</option>
              <option value="surcharge">Group by Surcharge</option>
            </Select>
          )}
        </div>
      </Toolbar>

      {notice && <div style={{ color: '#0a7f3f', marginBottom: '0.5rem' }}>{notice}</div>}
      {error && <div style={{ color: '#b00020', marginBottom: '0.5rem' }}>{error}</div>}

      {viewMode === 'table' && (
      <Grid>
        <thead>
          <tr>
            <Th>Schedule ID</Th>
            <Th>Plan ID</Th>
            <Th>Payment Description</Th>
            <Th>Installment No</Th>
            <Th>Due Date</Th>
            <Th>Amount</Th>
            <Th>Surcharge Applied</Th>
            <Th>Surcharge Rate</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><Td colSpan={10}>Loading...</Td></tr>
          ) : filtered.length === 0 ? (
            <tr><Td colSpan={10}>No payment schedules found</Td></tr>
          ) : (
            filtered.map((r, i) => {
              const scheduleId = r.scheduleid ?? r.ScheduleId ?? r.scheduleId;
              const pId = r.planid ?? r.PlanId ?? r.planId;
              const desc = r.paymentdescription ?? r.PaymentDescription ?? r.paymentDescription;
              const instNo = r.installmentno ?? r.InstallmentNo ?? r.installmentNo;
              const due = r.duedate ?? r.DueDate ?? r.dueDate;
              const amt = r.amount ?? r.Amount ?? r.installmentAmount ?? r.InstallmentAmount ?? r.totalAmount ?? r.TotalAmount;
              const surchargeApplied = r.surchargeapplied ?? r.SurchargeApplied ?? r.surchargeApplied;
              const surchargeRate = r.surchargerate ?? r.SurchargeRate ?? r.surchargeRate;
              const note = r.description ?? r.Description ?? r.note ?? r.Note ?? r.notes ?? r.Notes;
              return (
                <tr key={scheduleId || i}>
                  <Td>{scheduleId}</Td>
                  <Td>{pId}</Td>
                  <Td>{desc ?? '-'}</Td>
                  <Td>{instNo ?? '-'}</Td>
                  <Td>{due ? String(due).slice(0,10) : '-'}</Td>
                  <Td>{amt ?? '-'}</Td>
                  <Td>{String(surchargeApplied ?? '-')}</Td>
                  <Td>{surchargeRate ?? '-'}</Td>
                  <Td>{note ?? '-'}</Td>
                  <Td>
                    <Button onClick={() => openEdit(r)}>Edit</Button>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Grid>
      )}

      {viewMode === 'grouped' && (
        <div>
          {loading ? (
            <div style={{ padding: '0.6rem', color: '#00234C' }}>Loading…</div>
          ) : groupedData.length === 0 ? (
            <div style={{ padding: '0.6rem', color: '#00234C' }}>No payment schedules found</div>
          ) : (
            <>
              <div style={{ padding: '0.4rem 0.6rem', color: '#00234C' }}>
                Showing all schedules (all pages loaded for grouping)
              </div>
              {groupedData.map(group => {
                const isOpen = openGroups.has(group.key);
                return (
                  <GroupWrap key={group.key}>
                  <GroupHeader open={isOpen} onClick={() => {
                    const next = new Set(openGroups);
                    if (isOpen) next.delete(group.key); else next.add(group.key);
                    setOpenGroups(next);
                  }}>
                    <GroupTitle>
                      <Caret open={isOpen}>▶</Caret>
                      <span>{group.label}</span>
                    </GroupTitle>
                    <GroupCount>{group.items.length}</GroupCount>
                  </GroupHeader>
                  {isOpen && (
                    <GroupBody>
                      <Grid>
                        <thead>
                          <tr>
                            <Th>Schedule ID</Th>
                            <Th>Plan ID</Th>
                            <Th>Description</Th>
                            <Th>Installment No</Th>
                            <Th>Due Date</Th>
                            <Th>Amount</Th>
                            <Th>Surcharge</Th>
                            <Th>Rate</Th>
                            <Th>Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(nr => (
                            <tr key={nr.scheduleId}>
                              <Td>{nr.scheduleId}</Td>
                              <Td>{nr.planId}</Td>
                              <Td>{nr.description}</Td>
                              <Td>{nr.installmentNo}</Td>
                              <Td>{nr.dueDate}</Td>
                              <Td>{nr.amount}</Td>
                              <Td>{String(nr.surchargeApplied)}</Td>
                              <Td>{nr.surchargeRate}</Td>
                              <Td>
                                <Button onClick={() => openEdit(nr.raw)}>Edit</Button>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Grid>
                    </GroupBody>
                  )}
                </GroupWrap>
              );
              })}
            </>
          )}
        </div>
      )}

      {viewMode === 'table' && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Prev</Button>
          <span style={{ color: '#00234C' }}>Page {page} / {meta.totalPages || 1}</span>
          <Button onClick={() => setPage(p => p + 1)} disabled={loading || (meta.totalPages && page >= meta.totalPages)}>Next</Button>
        </div>
      )}
      {editOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Edit Schedule Payment</ModalTitle>
            <div style={{ color: '#666', marginBottom: '0.5rem' }}>Schedule ID: <strong style={{ color: '#00234C' }}>{editScheduleId}</strong></div>
            <ModalRow>
              <div>
                <Label>Description</Label>
                <ModalTextarea value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
              <div>
                <Label>Installment No</Label>
                <ModalInput type="number" value={formInstNo} onChange={e => setFormInstNo(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow>
              <div>
                <Label>Due Date</Label>
                <ModalInput type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
              </div>
              <div>
                <Label>Amount</Label>
                <ModalInput type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow>
              <div>
                <Label><input type="checkbox" checked={formSurchargeApplied} onChange={e => setFormSurchargeApplied(e.target.checked)} style={{ marginRight: '0.4rem' }} /> Surcharge Applied</Label>
              </div>
              <div>
                <Label>Surcharge Rate (%)</Label>
                <ModalInput type="number" step="0.01" value={formSurchargeRate} onChange={e => setFormSurchargeRate(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <Label>Note</Label>
                <ModalTextarea value={formNote} onChange={e => setFormNote(e.target.value)} />
              </div>
            </ModalRow>
            <ModalActions>
              <Button onClick={() => setEditOpen(false)} style={{ background: '#777' }}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}

      {addOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Add Schedule Payment</ModalTitle>
            <div style={{ color: '#666', marginBottom: '0.5rem' }}>Plan ID: <strong style={{ color: '#00234C' }}>{String(planId || '').trim()}</strong></div>
            {addError && <div style={{ color: '#b00020', marginBottom: '0.5rem' }}>{addError}</div>}
            <ModalRow>
              <div>
                <Label>Description</Label>
                <ModalTextarea value={addDesc} onChange={e => setAddDesc(e.target.value)} />
              </div>
              <div>
                <Label>Installment No</Label>
                <ModalInput type="number" value={addInstNo} onChange={e => setAddInstNo(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow>
              <div>
                <Label>Due Date</Label>
                <ModalInput type="date" value={addDueDate} onChange={e => setAddDueDate(e.target.value)} />
              </div>
              <div>
                <Label>Amount</Label>
                <ModalInput type="number" step="0.01" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow>
              <div>
                <Label><input type="checkbox" checked={addSurchargeApplied} onChange={e => setAddSurchargeApplied(e.target.checked)} style={{ marginRight: '0.4rem' }} /> Surcharge Applied</Label>
              </div>
              <div>
                <Label>Surcharge Rate (%)</Label>
                <ModalInput type="number" step="0.01" value={addSurchargeRate} onChange={e => setAddSurchargeRate(e.target.value)} />
              </div>
            </ModalRow>
            <ModalRow style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <Label>Note</Label>
                <ModalTextarea value={addNote} onChange={e => setAddNote(e.target.value)} />
              </div>
            </ModalRow>
            <ModalActions>
              <Button onClick={() => setAddOpen(false)} style={{ background: '#777' }}>Cancel</Button>
              <Button onClick={saveAdd} disabled={saving}>{saving ? 'Saving…' : 'Create Schedule'}</Button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrap>
  );
}