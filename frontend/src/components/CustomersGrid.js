import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../utils/api';
import PaymentSchedules from '../pages/schedule/PaymentSchedules';

const PageContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  font-family: 'Lexend', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  margin-bottom: 0.75rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderRight = styled.div`
  margin-left: auto;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${p => p.theme.colors.secondary};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: ${props => props.$variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$variant === 'primary' ? 'white' : props.theme.colors.secondary};
  border: 1px solid ${props => props.theme.colors.secondary};
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.65rem 0.75rem;
  background: ${props => props.theme.colors.lightGray};
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
  font-size: 0.95rem; /* slightly lesser for compact header */
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.lightGray};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: white;
  background: ${props => props.status === 'Active' ? props.theme.colors.primary : '#d9534f'};
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Select = styled.select`
  padding: 0.4rem 0.5rem;
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
`;

const SmallButton = styled.button`
  background: ${props => props.theme.colors.secondary};
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const DetailText = styled.span`
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: ${props => props.theme.colors.lightGray || '#f5f5f5'};
  border-radius: 4px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
  font-size: 0.9rem;
  max-width: 400px;
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const SearchLabel = styled.label`
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  width: 720px;
  max-width: 92vw;
  background: white;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.2);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalBody = styled.div`
  padding: 1rem;
`;

const CloseButton = styled.button`
  background: transparent;
  color: white;
  border: 1px solid rgba(255,255,255,0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
`;

/**
 * CustomersGrid
 * Purpose: Reusable grid for customers with filters, pagination, and details.
 * Inputs:
 *  - title: string heading for the grid (e.g., 'All Customers')
 *  - defaultFilter: 'All' | 'Active' | 'Blocked'
 * Outputs:
 *  - Renders a paginated table with server-side and client-side filters.
 */
export default function CustomersGrid({ title = 'Customers', defaultFilter = 'All' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [allotmentFilter, setAllotmentFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    FullName: '',
    FatherName: '',
    Cnic: '',
    PassportNo: '',
    Dob: null,
    Gender: '',
    Phone: '',
    Email: '',
    MailingAddress: '',
    PermanentAddress: '',
    City: '',
    Country: '',
    SubProject: '',
    RegisteredSize: '',
    Status: 'Active',
    NomineeName: '',
    NomineeId: '',
    NomineeRelation: '',
    AdditionalInfo: '',
    AllotmentStatus: '',
    RegId: null,
    PlanId: null,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const routeFilter = useMemo(() => defaultFilter, [defaultFilter]);

  /**
   * toText
   * Purpose: Safely convert any value to a user-friendly text for rendering.
   * Inputs:
   *  - v: any value (string, number, null, object)
   * Outputs:
   *  - string suitable for React text nodes; returns '' for objects/undefined.
   */
  const toText = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return '';
    const s = String(v);
    return s.trim();
  };

  /**
   * handlePlanClick
   * Purpose: Toggle the inline child PaymentSchedules grid under a row.
   * Inputs:
   *  - rowId: string customer id for the clicked row
   *  - planId: string payment plan id to show schedules for
   * Outputs:
   *  - Sets expanded row state and passes planId to child grid.
   */
  const handlePlanClick = (rowId, planId) => {
    const rid = String(rowId || '').trim();
    const pid = String(planId || '').trim();
    if (!rid || !pid) return;
    if (expandedCustomerId === rid) {
      // Collapse if same row is already expanded
      setExpandedCustomerId(null);
      setExpandedPlanId('');
    } else {
      setExpandedCustomerId(rid);
      setExpandedPlanId(pid);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const params = {
      ...(routeFilter === 'All' ? {} : { status: routeFilter }),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(allotmentFilter ? { allotmentstatus: allotmentFilter } : {}),
      ...(allotmentFilter ? { allotment: allotmentFilter } : {}),
      ...(search ? { search: search.trim() } : {}),
      page,
      pageSize,
    };
    getCustomers(params)
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!isMounted) return;
        setCustomers(list);
        const tc = typeof data?.totalCount === 'number' ? data.totalCount : list.length;
        const pg = typeof data?.page === 'number' ? data.page : page;
        const ps = typeof data?.pageSize === 'number' ? data.pageSize : pageSize;
        const tp = typeof data?.totalPages === 'number' ? data.totalPages : Math.max(1, Math.ceil(tc / ps));
        setTotalCount(tc);
        setPage(pg);
        setPageSize(ps);
        setTotalPages(tp);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load customers');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [routeFilter, statusFilter, allotmentFilter, search, page, pageSize]);

  /**
   * handleRowDoubleClick
   * Purpose: Load the selected customer's details and open the modal.
   * Inputs:
   *  - id: string customer identifier
   * Outputs:
   *  - Populates detail state and sets selectedId for the modal.
   */
  const handleRowDoubleClick = async (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    setSelectedId(cid);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await getCustomer(cid);
      setDetail(data);
      // Initialize form for editing (normalize keys to match backend model)
      const normalized = {
        CustomerId: data.CustomerId ?? data.customerId ?? cid,
        RegId: data.RegId ?? data.regId ?? null,
        PlanId: data.PlanId ?? data.planId ?? null,
        FullName: data.FullName ?? data.fullName ?? '',
        FatherName: data.FatherName ?? data.fatherName ?? '',
        Cnic: data.Cnic ?? data.cnic ?? '',
        PassportNo: data.PassportNo ?? data.passportNo ?? '',
        Dob: data.Dob ?? data.dob ?? null,
        Gender: data.Gender ?? data.gender ?? '',
        Phone: data.Phone ?? data.phone ?? '',
        Email: data.Email ?? data.email ?? '',
        MailingAddress: data.MailingAddress ?? data.mailingAddress ?? '',
        PermanentAddress: data.PermanentAddress ?? data.permanentAddress ?? '',
        City: data.City ?? data.city ?? '',
        Country: data.Country ?? data.country ?? '',
        SubProject: data.SubProject ?? data.subProject ?? '',
        RegisteredSize: data.RegisteredSize ?? data.registeredSize ?? '',
        Status: data.Status ?? data.status ?? 'Active',
        NomineeName: data.NomineeName ?? data.nomineeName ?? '',
        NomineeId: data.NomineeId ?? data.nomineeId ?? '',
        NomineeRelation: data.NomineeRelation ?? data.nomineeRelation ?? '',
        AdditionalInfo: data.AdditionalInfo ?? data.additionalInfo ?? '',
      };
      setForm(normalized);
      setEditMode(false);
    } catch (e) {
      setDetailError(e.message || 'Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * handleEditToggle
   * Purpose: Toggle the edit mode on the customer detail modal.
   * Inputs: none
   * Outputs: switches editMode state to enable/disable editing.
   */
  const handleEditToggle = () => {
    setEditMode((prev) => !prev);
    setSaveError('');
  };

  /**
   * handleFormChange
   * Purpose: Update local form state on input change for edit fields.
   * Inputs:
   *  - field: string field name (e.g., 'FullName')
   *  - value: any new value
   * Outputs:
   *  - Updates the form state for the given field.
   */
  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * handleSave
   * Purpose: Persist customer updates via API and refresh local state.
   * Inputs: none (uses selectedId and form state)
   * Outputs:
   *  - Calls updateCustomer, updates detail and list, exits edit mode.
   */
  const handleSave = async () => {
    if (!selectedId || !form) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, CustomerId: selectedId };
      const updated = await updateCustomer(selectedId, payload);
      setDetail(updated);
      setEditMode(false);
      // Update the list view with latest fields (robust key mapping)
      setCustomers((prev) => prev.map((c) => {
        const id = c.CustomerId || c.customerId || c.id;
        if (String(id) !== String(selectedId)) return c;
        return {
          ...c,
          CustomerId: updated.CustomerId ?? updated.customerId ?? id,
          FullName: updated.FullName ?? updated.fullName ?? c.FullName ?? c.fullName,
          Gender: updated.Gender ?? updated.gender ?? c.Gender ?? c.gender,
          Email: updated.Email ?? updated.email ?? c.Email ?? c.email,
          Phone: updated.Phone ?? updated.phone ?? c.Phone ?? c.phone,
          Cnic: updated.Cnic ?? updated.cnic ?? c.Cnic ?? c.cnic,
          Status: updated.Status ?? updated.status ?? c.Status ?? c.status,
          City: updated.City ?? updated.city ?? c.City ?? c.city,
          Country: updated.Country ?? updated.country ?? c.Country ?? c.country,
          RegId: updated.RegId ?? updated.regId ?? c.RegId ?? c.regId,
          PlanId: updated.PlanId ?? updated.planId ?? c.PlanId ?? c.planId,
        };
      }));
      // Reload the list to ensure consistency
      setPage(1);
    } catch (e) {
      setSaveError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleCreate
   * Purpose: Create a new customer via API and refresh the list.
   * Inputs: none (uses createForm state)
   * Outputs:
   *  - Creates customer and refreshes the grid.
   */
  const handleCreate = async () => {
    if (!createForm.FullName || !createForm.Email) {
      setCreateError('Full Name and Email are required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        ...createForm,
        CustomerId: null, // Let backend generate ID
      };
      await createCustomer(payload);
      setShowCreate(false);
      setCreateForm({
        FullName: '',
        FatherName: '',
        Cnic: '',
        PassportNo: '',
        Dob: null,
        Gender: '',
        Phone: '',
        Email: '',
        MailingAddress: '',
        PermanentAddress: '',
        City: '',
        Country: '',
        SubProject: '',
        RegisteredSize: '',
        Status: 'Active',
        NomineeName: '',
        NomineeId: '',
        NomineeRelation: '',
        AdditionalInfo: '',
        AllotmentStatus: '',
        RegId: null,
        PlanId: null,
      });
      // Reload the list
      setPage(1);
    } catch (e) {
      setCreateError(e.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  /**
   * handleDelete
   * Purpose: Delete a customer by ID (soft delete - sets status to "Deleted").
   * Inputs:
   *  - id: string customer identifier
   * Outputs:
   *  - Deletes customer and refreshes the grid.
   */
  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete customer ${id}? This will set their status to "Deleted".`)) {
      return;
    }
    try {
      await deleteCustomer(id);
      setSelectedId(null);
      setDetail(null);
      setEditMode(false);
      setForm(null);
      // Reload the list
      setPage(1);
    } catch (e) {
      alert(e.message || 'Failed to delete customer');
    }
  };

  /**
   * handleCreateFormChange
   * Purpose: Update create form state on input change.
   * Inputs:
   *  - field: string field name
   *  - value: any new value
   * Outputs:
   *  - Updates the createForm state for the given field.
   */
  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const filtered = useMemo(() => {
    const norm = v => String(v ?? '').trim().toLowerCase();

    let list = customers;
    if (routeFilter !== 'All') {
      list = list.filter(c => (c.Status || c.status) === routeFilter || (c.IsActive === true && routeFilter === 'Active') || (c.IsActive === false && routeFilter === 'Blocked'));
    }

    if (allotmentFilter) {
      const target = norm(allotmentFilter);
      list = list.filter(c => {
        const val = norm(c.AllotmentStatus || c.allotmentStatus || c.allotmentstatus);
        return val === target;
      });
    }

    return list;
  }, [customers, routeFilter, allotmentFilter]);

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <Title>{title}</Title>
          <Actions>
            <Select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              aria-label="Status Filter"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            <Select
              value={allotmentFilter}
              onChange={(e) => { setPage(1); setAllotmentFilter(e.target.value); }}
              aria-label="Allotment Status"
            >
              <option value="">All Allotment Statuses</option>
              <option value="Allotted">Allotted</option>
              <option value="Not Allotted">Not Allotted</option>
              <option value="Pending">Pending</option>
            </Select>
          </Actions>
        </HeaderLeft>
        <HeaderRight>
          <Button $variant="primary" onClick={() => setShowCreate(true)}>
            + New Customer
          </Button>
        </HeaderRight>
      </Header>

      <SearchContainer>
        <SearchLabel htmlFor="customer-search">Search:</SearchLabel>
        <SearchInput
          id="customer-search"
          type="text"
          placeholder="Search by Customer ID or CNIC..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page when searching
          }}
        />
        {search && (
          <Button
            $variant="secondary"
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
            style={{ whiteSpace: 'nowrap' }}
          >
            Clear
          </Button>
        )}
      </SearchContainer>

      {loading && <div>Loading customers…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <Table>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <Th>Customer ID</Th>
              <Th>Full Name</Th>
              <Th>CNIC</Th>
              <Th>Gender</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const rowId = c.CustomerId || c.customerId || c.id;
              const planId = c.PlanId ?? c.planId;
              const isExpanded = String(expandedCustomerId || '') === String(rowId || '');
              return (
                <>
                  <tr
                    key={rowId}
                    onDoubleClick={() => handleRowDoubleClick(rowId)}
                    style={{ cursor: 'pointer' }}
                    title="Double-click to open details"
                  >
                    <Td>{toText(rowId)}</Td>
                    <Td>{toText(c.FullName || c.fullName || c.full_name || c.Name || c.name)}</Td>
                    <Td>{toText(c.Cnic || c.cnic)}</Td>
                    <Td>{toText((c.Gender ?? c.gender ?? '')) || '—'}</Td>
                    <Td>{toText(c.Email || c.email)}</Td>
                    <Td>{toText(c.Phone || c.phone)}</Td>
                    <Td>
                      <StatusBadge status={(c.Status || c.status || (c.IsActive === true ? 'Active' : c.IsActive === false ? 'Blocked' : 'Unknown'))}>
                        {c.Status || c.status || (c.IsActive === true ? 'Active' : c.IsActive === false ? 'Blocked' : 'Unknown')}
                      </StatusBadge>
                    </Td>
                  </tr>
                  {isExpanded && expandedPlanId && (
                    <tr>
                      <Td colSpan={7} style={{ background: '#fff' }}>
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                          <PaymentSchedules defaultPlanId={expandedPlanId} />
                        </div>
                      </Td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan="7">No customers found.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {!loading && !error && (
        <Footer>
          <div>
            Showing {filtered.length} of {totalCount} customers
          </div>
          <Pager>
            <span>Rows per page:</span>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(parseInt(e.target.value, 10));
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
            <span>Page {page} of {totalPages}</span>
            <SmallButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </SmallButton>
            <SmallButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </SmallButton>
          </Pager>
        </Footer>
      )}

      {selectedId && (
        <ModalBackdrop onClick={() => { setSelectedId(null); setDetail(null); }}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <span>Customer Details — {selectedId}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button $variant={editMode ? 'primary' : 'secondary'} onClick={handleEditToggle}>
                  {editMode ? 'Cancel Edit' : 'Edit'}
                </Button>
                <CloseButton onClick={() => { setSelectedId(null); setDetail(null); setEditMode(false); setForm(null); }}>Close</CloseButton>
              </div>
            </ModalHeader>
            <ModalBody>
              {detailLoading && <div>Loading details…</div>}
              {detailError && <div style={{ color: 'crimson' }}>{detailError}</div>}
              {!detailLoading && !detailError && detail && !editMode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><strong>ID:</strong> {toText(detail.customerId || detail.CustomerId)}</div>
                  <div><strong>Name:</strong> {toText(detail.fullName || detail.FullName)}</div>
                  <div><strong>Gender:</strong> {toText(detail.gender ?? detail.Gender ?? '') || '—'}</div>
                  <div><strong>Email:</strong> {toText(detail.email || detail.Email)}</div>
                  <div><strong>Phone:</strong> {toText(detail.phone || detail.Phone)}</div>
                  <div><strong>CNIC:</strong> {toText(detail.cnic || detail.Cnic)}</div>
                  <div><strong>Status:</strong> {toText(detail.status || detail.Status)}</div>
                  <div><strong>City:</strong> {toText(detail.city || detail.City)}</div>
                  <div><strong>Country:</strong> {toText(detail.country || detail.Country)}</div>
                  <div><strong>Reg ID:</strong> {toText(detail.regId || detail.RegId)}</div>
                  <div><strong>Plan ID:</strong> {toText(detail.planId || detail.PlanId)}</div>
                </div>
              )}
              {!detailLoading && !detailError && detail && editMode && form && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'Lexend, sans-serif' }}>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Full Name</label>
                    <input value={form.FullName}
                           onChange={(e) => handleFormChange('FullName', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Email</label>
                    <input value={form.Email}
                           onChange={(e) => handleFormChange('Email', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Phone</label>
                    <input value={form.Phone}
                           onChange={(e) => handleFormChange('Phone', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>CNIC</label>
                    <input value={form.Cnic}
                           onChange={(e) => handleFormChange('Cnic', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Gender</label>
                    <select value={form.Gender}
                            onChange={(e) => handleFormChange('Gender', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}>
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Status</label>
                    <select value={form.Status}
                            onChange={(e) => handleFormChange('Status', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}>
                      <option value="Active">Active</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>City</label>
                    <input value={form.City}
                           onChange={(e) => handleFormChange('City', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Country</label>
                    <input value={form.Country}
                           onChange={(e) => handleFormChange('Country', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Reg ID</label>
                    <input value={form.RegId ?? ''}
                           onChange={(e) => handleFormChange('RegId', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#00234C', fontWeight: 600 }}>Plan ID</label>
                    <input value={form.PlanId ?? ''}
                           onChange={(e) => handleFormChange('PlanId', e.target.value)}
                           style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                  </div>

                  {saveError && <div style={{ gridColumn: '1 / -1', color: 'crimson' }}>{saveError}</div>}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <Button $variant="secondary" onClick={() => handleDelete(selectedId)} style={{ background: '#dc3545', color: 'white', border: '1px solid #dc3545' }}>
                      Delete
                    </Button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button $variant="secondary" onClick={handleEditToggle}>Cancel</Button>
                      <Button $variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showCreate && (
        <ModalBackdrop onClick={() => { setShowCreate(false); setCreateError(''); }}>
          <ModalCard onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <ModalHeader>
              <span>Create New Customer</span>
              <CloseButton onClick={() => { setShowCreate(false); setCreateError(''); }}>Close</CloseButton>
            </ModalHeader>
            <ModalBody>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'Lexend, sans-serif' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Full Name <span style={{ color: 'red' }}>*</span></label>
                  <input value={createForm.FullName}
                         onChange={(e) => handleCreateFormChange('FullName', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Father Name</label>
                  <input value={createForm.FatherName}
                         onChange={(e) => handleCreateFormChange('FatherName', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>CNIC</label>
                  <input value={createForm.Cnic}
                         onChange={(e) => handleCreateFormChange('Cnic', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Passport No</label>
                  <input value={createForm.PassportNo}
                         onChange={(e) => handleCreateFormChange('PassportNo', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Date of Birth</label>
                  <input type="date"
                         value={createForm.Dob || ''}
                         onChange={(e) => handleCreateFormChange('Dob', e.target.value || null)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Gender</label>
                  <select value={createForm.Gender}
                          onChange={(e) => handleCreateFormChange('Gender', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}>
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Phone</label>
                  <input value={createForm.Phone}
                         onChange={(e) => handleCreateFormChange('Phone', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Email <span style={{ color: 'red' }}>*</span></label>
                  <input type="email" value={createForm.Email}
                         onChange={(e) => handleCreateFormChange('Email', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Mailing Address</label>
                  <textarea value={createForm.MailingAddress}
                            onChange={(e) => handleCreateFormChange('MailingAddress', e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Permanent Address</label>
                  <textarea value={createForm.PermanentAddress}
                            onChange={(e) => handleCreateFormChange('PermanentAddress', e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>City</label>
                  <input value={createForm.City}
                         onChange={(e) => handleCreateFormChange('City', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Country</label>
                  <input value={createForm.Country}
                         onChange={(e) => handleCreateFormChange('Country', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Sub Project</label>
                  <input value={createForm.SubProject}
                         onChange={(e) => handleCreateFormChange('SubProject', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Registered Size</label>
                  <input value={createForm.RegisteredSize}
                         onChange={(e) => handleCreateFormChange('RegisteredSize', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Status</label>
                  <select value={createForm.Status}
                          onChange={(e) => handleCreateFormChange('Status', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}>
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Allotment Status</label>
                  <select value={createForm.AllotmentStatus}
                          onChange={(e) => handleCreateFormChange('AllotmentStatus', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}>
                    <option value="">—</option>
                    <option value="Allotted">Allotted</option>
                    <option value="Not Allotted">Not Allotted</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Nominee Name</label>
                  <input value={createForm.NomineeName}
                         onChange={(e) => handleCreateFormChange('NomineeName', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Nominee ID</label>
                  <input value={createForm.NomineeId}
                         onChange={(e) => handleCreateFormChange('NomineeId', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Nominee Relation</label>
                  <input value={createForm.NomineeRelation}
                         onChange={(e) => handleCreateFormChange('NomineeRelation', e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Additional Info</label>
                  <textarea value={createForm.AdditionalInfo}
                            onChange={(e) => handleCreateFormChange('AdditionalInfo', e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Reg ID</label>
                  <input value={createForm.RegId || ''}
                         onChange={(e) => handleCreateFormChange('RegId', e.target.value || null)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#00234C', fontWeight: 600 }}>Plan ID</label>
                  <input value={createForm.PlanId || ''}
                         onChange={(e) => handleCreateFormChange('PlanId', e.target.value || null)}
                         style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }} />
                </div>

                {createError && <div style={{ gridColumn: '1 / -1', color: 'crimson' }}>{createError}</div>}
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button $variant="secondary" onClick={() => { setShowCreate(false); setCreateError(''); }}>Cancel</Button>
                  <Button $variant="primary" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creating…' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
  );
}