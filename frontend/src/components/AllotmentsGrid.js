import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getAllotments } from '../utils/api';

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
  font-size: 0.8rem;
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
  background: ${props => {
    if (props.status === 'Active') return props.theme.colors.primary;
    if (props.status === 'Pending') return '#ffc107';
    if (props.status === 'Cancelled') return '#d9534f';
    return '#6c757d';
  }};
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
  font-size: 0.75rem;
`;

const SmallButton = styled.button`
  background: ${props => props.theme.colors.secondary};
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const SearchContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.lightGray};
  border-radius: 4px;
  font-size: 0.8rem;
`;

const SearchLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  color: ${p => p.theme.colors.secondary};
  margin-bottom: 0.25rem;
`;

/**
 * toText
 * Purpose: Safely convert any value to a user-friendly text for rendering.
 */
const toText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v);
};

/**
 * AllotmentsGrid
 * Purpose: Reusable grid for allotments with filters, pagination, and details.
 */
export default function AllotmentsGrid({ title = 'All Allotments', defaultFilter = 'All' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allotments, setAllotments] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerIdFilter, setCustomerIdFilter] = useState('');
  const [search, setSearch] = useState('');

  const routeFilter = useMemo(() => defaultFilter, [defaultFilter]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const params = {
      ...(routeFilter !== 'All' ? { status: routeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(customerIdFilter ? { customerId: customerIdFilter } : {}),
      page,
      pageSize,
    };

    getAllotments(params)
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!isMounted) return;
        setAllotments(list);
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
        setError(err.message || 'Failed to load allotments');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [routeFilter, statusFilter, customerIdFilter, page, pageSize]);

  // Client-side search filtering (server-side pagination is handled by API)
  const filtered = useMemo(() => {
    if (!search) return allotments;
    const norm = v => String(v ?? '').trim().toLowerCase();
    const searchLower = norm(search);
    return allotments.filter(a => {
      const allotmentId = norm(a.AllotmentId || a.allotmentId || a.id || '');
      const customerId = norm(a.CustomerId || a.customerId || '');
      const propertyId = norm(a.PropertyId || a.propertyId || '');
      const customerName = norm(a.Customer?.FullName || a.Customer?.fullName || a.customerName || '');
      const propertyName = norm(a.Property?.PropertyId || a.Property?.propertyId || a.propertyName || '');
      return allotmentId.includes(searchLower) ||
             customerId.includes(searchLower) ||
             propertyId.includes(searchLower) ||
             customerName.includes(searchLower) ||
             propertyName.includes(searchLower);
    });
  }, [allotments, search]);

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
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            <Select
              value={customerIdFilter}
              onChange={(e) => { setPage(1); setCustomerIdFilter(e.target.value); }}
              aria-label="Customer Filter"
            >
              <option value="">All Customers</option>
              {Array.from(new Set(allotments.map(a => a.CustomerId || a.customerId).filter(Boolean))).map(cid => (
                <option key={cid} value={cid}>{cid}</option>
              ))}
            </Select>
          </Actions>
        </HeaderLeft>
        <HeaderRight>
        </HeaderRight>
      </Header>

      <SearchContainer>
        <SearchLabel htmlFor="allotment-search">Search:</SearchLabel>
        <SearchInput
          id="allotment-search"
          type="text"
          placeholder="Search by Allotment ID, Customer ID, Property ID, Customer Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search Allotments"
        />
      </SearchContainer>

      {loading && <div>Loading allotments…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <Table>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              <Th>Allotment ID</Th>
              <Th>Customer ID</Th>
              <Th>Customer Name</Th>
              <Th>Property ID</Th>
              <Th>Allotment Date</Th>
              <Th>Letter No</Th>
              <Th>Status</Th>
              <Th>Remarks</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const allotmentId = a.AllotmentId || a.allotmentId || a.id;
              const customerId = a.CustomerId || a.customerId;
              const propertyId = a.PropertyId || a.propertyId;
              const customerName = a.Customer?.FullName || a.Customer?.fullName || a.customerName || '—';
              const allotmentDate = a.AllotmentDate || a.allotmentDate;
              const letterNo = a.AllotmentLetterNo || a.allotment_letter_no || a.allotmentLetterNo || '—';
              const status = a.Status || a.status || 'Active';
              const remarks = a.Remarks || a.remarks || '—';
              
              return (
                <tr
                  key={allotmentId}
                  style={{ cursor: 'pointer' }}
                  title="Double-click to view details"
                >
                  <Td>{toText(allotmentId)}</Td>
                  <Td>{toText(customerId)}</Td>
                  <Td>{toText(customerName)}</Td>
                  <Td>{toText(propertyId)}</Td>
                  <Td>{allotmentDate ? new Date(allotmentDate).toLocaleDateString() : '—'}</Td>
                  <Td>{toText(letterNo)}</Td>
                  <Td>
                    <StatusBadge status={status}>
                      {status}
                    </StatusBadge>
                  </Td>
                  <Td>{toText(remarks)}</Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan="8">No allotments found.</Td>
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
            <span style={{ fontSize: '0.75rem' }}>Page {page} of {totalPages}</span>
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
    </PageContainer>
  );
}

