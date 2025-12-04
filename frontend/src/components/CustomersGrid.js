import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../utils/api';
import PaymentSchedules from '../pages/schedule/PaymentSchedules';
import CustomerActionModal from './CustomerActionModal';
import CustomerStatement from './CustomerStatement';

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
  font-size: 0.9rem;
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
  font-size: 0.8rem;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.lightGray};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
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
  font-size: 0.8rem;
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
  font-size: 0.8rem;
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

// Note: ModalBackdrop, ModalCard, ModalHeader, ModalBody, CloseButton are still used by
// the Column Configuration modal below

/**
 * CustomersGrid
 * Purpose: Reusable grid for customers with filters, pagination, and details.
 * Inputs:
 *  - title: string heading for the grid (e.g., 'All Customers')
 *  - defaultFilter: 'All' | 'Active' | 'Blocked'
 * Outputs:
 *  - Renders a paginated table with server-side and client-side filters.
 */
// Available column definitions
const AVAILABLE_COLUMNS = [
  { id: 'customerId', label: 'Customer ID', field: 'CustomerId', width: '12%', defaultVisible: true },
  { id: 'fullName', label: 'Full Name', field: 'FullName', width: '18%', defaultVisible: true },
  { id: 'cnic', label: 'CNIC', field: 'Cnic', width: '14%', defaultVisible: true },
  { id: 'gender', label: 'Gender', field: 'Gender', width: '10%', defaultVisible: true },
  { id: 'email', label: 'Email', field: 'Email', width: '26%', defaultVisible: true },
  { id: 'phone', label: 'Phone', field: 'Phone', width: '12%', defaultVisible: true },
  { id: 'status', label: 'Status', field: 'Status', width: '8%', defaultVisible: true },
  { id: 'fatherName', label: 'Father Name', field: 'FatherName', width: '15%', defaultVisible: false },
  { id: 'passportNo', label: 'Passport No', field: 'PassportNo', width: '12%', defaultVisible: false },
  { id: 'dob', label: 'Date of Birth', field: 'Dob', width: '12%', defaultVisible: false },
  { id: 'city', label: 'City', field: 'City', width: '12%', defaultVisible: false },
  { id: 'country', label: 'Country', field: 'Country', width: '12%', defaultVisible: false },
  { id: 'subProject', label: 'Sub Project', field: 'SubProject', width: '12%', defaultVisible: false },
  { id: 'registeredSize', label: 'Registered Size', field: 'RegisteredSize', width: '12%', defaultVisible: false },
  { id: 'regId', label: 'Reg ID', field: 'RegId', width: '10%', defaultVisible: false },
  { id: 'planId', label: 'Plan ID', field: 'PlanId', width: '10%', defaultVisible: false },
  { id: 'allotmentStatus', label: 'Allotment Status', field: 'AllotmentStatus', width: '12%', defaultVisible: false },
  { id: 'createdAt', label: 'Created At', field: 'CreatedAt', width: '12%', defaultVisible: false },
];

// Load column preferences from localStorage
const loadColumnPreferences = () => {
  try {
    const saved = localStorage.getItem('customersGrid_columns');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load column preferences:', e);
  }
  // Return default visible columns
  return AVAILABLE_COLUMNS.map(col => ({
    id: col.id,
    visible: col.defaultVisible,
    order: AVAILABLE_COLUMNS.indexOf(col)
  }));
};

// Save column preferences to localStorage
const saveColumnPreferences = (preferences) => {
  try {
    localStorage.setItem('customersGrid_columns', JSON.stringify(preferences));
  } catch (e) {
    console.error('Failed to save column preferences:', e);
  }
};

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
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState('');
  const [search, setSearch] = useState('');
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columnPreferences, setColumnPreferences] = useState(() => loadColumnPreferences());
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionCustomerId, setActionCustomerId] = useState(null);
  const [actionCustomerName, setActionCustomerName] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [statementCustomerId, setStatementCustomerId] = useState(null);

  const routeFilter = useMemo(() => defaultFilter, [defaultFilter]);

  // Get visible columns in order
  const visibleColumns = useMemo(() => {
    const prefs = columnPreferences;
    return AVAILABLE_COLUMNS
      .map((col, index) => ({
        ...col,
        order: prefs.find(p => p.id === col.id)?.order ?? index,
        visible: prefs.find(p => p.id === col.id)?.visible ?? col.defaultVisible
      }))
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [columnPreferences]);

  // Handle column visibility toggle
  const toggleColumnVisibility = (columnId) => {
    setColumnPreferences(prev => {
      const existing = prev.find(p => p.id === columnId);
      const isCurrentlyVisible = existing?.visible ?? AVAILABLE_COLUMNS.find(c => c.id === columnId)?.defaultVisible ?? false;
      const willBeVisible = !isCurrentlyVisible;
      
      let updated;
      if (existing) {
        updated = prev.map(p => 
          p.id === columnId ? { ...p, visible: willBeVisible } : p
        );
      } else {
        const col = AVAILABLE_COLUMNS.find(c => c.id === columnId);
        updated = [...prev, {
          id: columnId,
          visible: willBeVisible,
          order: col ? AVAILABLE_COLUMNS.indexOf(col) : prev.length
        }];
      }
      
      // Recalculate orders for visible columns
      const visiblePrefs = updated.filter(p => p.visible).sort((a, b) => {
        const aIndex = AVAILABLE_COLUMNS.findIndex(c => c.id === a.id);
        const bIndex = AVAILABLE_COLUMNS.findIndex(c => c.id === b.id);
        return a.order - b.order || aIndex - bIndex;
      });
      visiblePrefs.forEach((p, index) => {
        p.order = index;
      });
      
      // Update the full array with new orders
      updated = updated.map(p => {
        const visiblePref = visiblePrefs.find(vp => vp.id === p.id);
        return visiblePref ? { ...p, order: visiblePref.order } : p;
      });
      
      saveColumnPreferences(updated);
      return updated;
    });
  };

  // Handle column reordering
  const moveColumn = (columnId, direction) => {
    setColumnPreferences(prev => {
      // Get only visible columns with their orders
      const visiblePrefs = prev
        .filter(p => p.visible)
        .sort((a, b) => a.order - b.order);
      
      const currentIndex = visiblePrefs.findIndex(p => p.id === columnId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= visiblePrefs.length) return prev;
      
      // Swap orders
      const tempOrder = visiblePrefs[currentIndex].order;
      visiblePrefs[currentIndex].order = visiblePrefs[newIndex].order;
      visiblePrefs[newIndex].order = tempOrder;
      
      // Update the full preferences array
      const updated = prev.map(p => {
        const visiblePref = visiblePrefs.find(vp => vp.id === p.id);
        return visiblePref ? { ...p, order: visiblePref.order } : p;
      });
      
      saveColumnPreferences(updated);
      return updated;
    });
  };

  // Reset to default columns
  const resetColumns = () => {
    const defaultPrefs = AVAILABLE_COLUMNS.map((col, index) => ({
      id: col.id,
      visible: col.defaultVisible,
      order: index
    }));
    setColumnPreferences(defaultPrefs);
    saveColumnPreferences(defaultPrefs);
  };

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
   * handleRowClick
   * Purpose: Handle single click on a customer row to show action modal.
   * Inputs:
   *  - id: string customer identifier
   *  - customer: customer object (optional, for name)
   * Outputs:
   *  - Shows action modal with options
   */
  const handleRowClick = (id, customer = null) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    
    const customerName = customer?.FullName || customer?.fullName || customer?.full_name || customer?.Name || customer?.name || null;
    setActionCustomerId(cid);
    setActionCustomerName(customerName);
    setShowActionModal(true);
  };

  /**
   * handleOpenCustomerRecord
   * Purpose: Navigate to full-page customer detail view.
   * Inputs:
   *  - id: string customer identifier
   * Outputs:
   *  - Navigates to /customers/all-customers/:id
   */
  const handleOpenCustomerRecord = (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    navigate(`/customers/all-customers/${cid}`);
  };

  /**
   * handleOpenStatement
   * Purpose: Open customer statement modal.
   * Inputs:
   *  - id: string customer identifier
   * Outputs:
   *  - Shows statement modal
   */
  const handleOpenStatement = (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    setStatementCustomerId(cid);
    setShowStatement(true);
  };

  /**
   * handleRowDoubleClick
   * Purpose: Navigate to full-page customer detail view.
   * Inputs:
   *  - id: string customer identifier
   * Outputs:
   *  - Navigates to /customers/all-customers/:id
   */
  const handleRowDoubleClick = (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    navigate(`/customers/all-customers/${cid}`);
  };

  /**
   * handleOpenCreatePage
   * Purpose: Navigate to new customer creation page.
   */
  const handleOpenCreatePage = () => {
    navigate('/customers/all-customers/new');
  };

  /**
   * handleViewCustomer
   * Purpose: Navigate to customer detail page (view mode).
   */
  const handleViewCustomer = (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    navigate(`/customers/all-customers/${cid}`);
  };

  /**
   * handleEditCustomer
   * Purpose: Navigate to customer edit page.
   */
  const handleEditCustomer = (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;
    navigate(`/customers/all-customers/${cid}/edit`);
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
          <Button onClick={() => setShowColumnConfig(true)} style={{ marginRight: '0.5rem' }}>
            Columns
          </Button>
          <Button $variant="primary" onClick={handleOpenCreatePage}>
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
            {visibleColumns.map(col => (
              <col key={col.id} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {visibleColumns.map(col => (
                <Th key={col.id}>{col.label}</Th>
              ))}
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
                    onClick={() => handleRowClick(rowId, c)}
                    onDoubleClick={() => handleRowDoubleClick(rowId)}
                    style={{ cursor: 'pointer' }}
                    title="Click to select action, double-click to open details"
                  >
                    {visibleColumns.map(col => {
                      let cellValue = '';
                      if (col.id === 'status') {
                        return (
                          <Td key={col.id}>
                            <StatusBadge status={(c.Status || c.status || (c.IsActive === true ? 'Active' : c.IsActive === false ? 'Blocked' : 'Unknown'))}>
                              {c.Status || c.status || (c.IsActive === true ? 'Active' : c.IsActive === false ? 'Blocked' : 'Unknown')}
                            </StatusBadge>
                          </Td>
                        );
                      } else if (col.id === 'customerId') {
                        cellValue = toText(rowId);
                      } else if (col.id === 'fullName') {
                        cellValue = toText(c.FullName || c.fullName || c.full_name || c.Name || c.name);
                      } else if (col.id === 'dob') {
                        const dob = c.Dob || c.dob;
                        cellValue = dob ? (typeof dob === 'string' ? dob.slice(0, 10) : new Date(dob).toISOString().slice(0, 10)) : '—';
                      } else if (col.id === 'createdAt') {
                        const createdAt = c.CreatedAt || c.createdAt || c.created_at;
                        cellValue = createdAt ? (typeof createdAt === 'string' ? createdAt.slice(0, 10) : new Date(createdAt).toISOString().slice(0, 10)) : '—';
                      } else {
                        const fieldValue = c[col.field] || c[col.field.toLowerCase()] || c[col.field.toUpperCase()];
                        cellValue = toText(fieldValue) || '—';
                      }
                      return <Td key={col.id}>{cellValue}</Td>;
                    })}
                  </tr>
                  {isExpanded && expandedPlanId && (
                    <tr>
                      <Td colSpan={visibleColumns.length} style={{ background: '#fff' }}>
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
                <Td colSpan={visibleColumns.length}>No customers found.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {!loading && !error && (
        <Footer>
          <div></div>
          <Pager>
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

      {/* New Tabbed Customer Form Modal */}

      {showColumnConfig && (
        <ModalBackdrop onClick={() => setShowColumnConfig(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <ModalHeader>
              <span>Configure Columns</span>
              <CloseButton onClick={() => setShowColumnConfig(false)}>Close</CloseButton>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: '1rem' }}>
                <Button onClick={resetColumns} style={{ marginBottom: '1rem' }}>
                  Reset to Default
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {AVAILABLE_COLUMNS.map((col) => {
                  const pref = columnPreferences.find(p => p.id === col.id) || {
                    id: col.id,
                    visible: col.defaultVisible,
                    order: AVAILABLE_COLUMNS.indexOf(col)
                  };
                  const isVisible = pref.visible;
                  const currentOrder = pref.order;
                  const visibleCount = columnPreferences.filter(p => p.visible).length;
                  
                  return (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        background: isVisible ? '#f8f9fa' : 'transparent',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(col.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>{col.label}</span>
                      {isVisible && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <Button
                            onClick={() => moveColumn(col.id, 'up')}
                            disabled={currentOrder === 0}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            ↑
                          </Button>
                          <Button
                            onClick={() => moveColumn(col.id, 'down')}
                            disabled={currentOrder >= visibleCount - 1}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            ↓
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                  Visible columns: {visibleColumns.length} of {AVAILABLE_COLUMNS.length}
                </div>
                <Button $variant="primary" onClick={() => setShowColumnConfig(false)}>
                  Done
                </Button>
              </div>
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showActionModal && (
        <CustomerActionModal
          customerId={actionCustomerId}
          customerName={actionCustomerName}
          onOpenRecord={handleOpenCustomerRecord}
          onOpenStatement={handleOpenStatement}
          onClose={() => {
            setShowActionModal(false);
            setActionCustomerId(null);
            setActionCustomerName(null);
          }}
        />
      )}

      {showStatement && statementCustomerId && (
        <CustomerStatement
          customerId={statementCustomerId}
          onClose={() => {
            setShowStatement(false);
            setStatementCustomerId(null);
          }}
        />
      )}
    </PageContainer>
  );
}