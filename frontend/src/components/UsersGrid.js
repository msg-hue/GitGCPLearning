import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { getUsers, getUser, updateUser, createUser, deleteUser, getRoles } from '../utils/api';

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
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  font-size: 0.95rem;
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
  background: ${props => props.status === 'Active' || props.status === true ? props.theme.colors.primary : '#d9534f'};
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
  &:disabled {
    cursor: not-allowed;
  }
`;

const DetailText = styled.span`
  color: ${props => props.theme.colors.secondary};
  font-weight: 600;
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

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #00234C;
  border-radius: 4px;
  font-family: 'Lexend', sans-serif;
`;

const Label = styled.label`
  color: #00234C;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
`;

/**
 * UsersGrid
 * Purpose: Reusable grid for users with filters, pagination, and details.
 * Inputs:
 *  - title: string heading for the grid (e.g., 'All Users')
 *  - defaultFilter: 'All' | 'Active' | 'Inactive'
 * Outputs:
 *  - Renders a paginated table with server-side and client-side filters.
 */
export default function UsersGrid({ title = 'Users', defaultFilter = 'All' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(null);
  const [roleIdFilter, setRoleIdFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const routeFilter = useMemo(() => defaultFilter, [defaultFilter]);

  /**
   * toText
   * Purpose: Safely convert any value to a user-friendly text for rendering.
   */
  const toText = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return '';
    const s = String(v);
    return s.trim();
  };

  // Function to load roles from API
  const loadRoles = React.useCallback((includeInactive = true) => {
    setRolesLoading(true);
    console.log('[UsersGrid] Loading roles from API...', { includeInactive });
    
    getRoles(includeInactive)
      .then(data => {
        console.log('[UsersGrid] Roles API response (raw):', data);
        console.log('[UsersGrid] Response type:', typeof data);
        console.log('[UsersGrid] Is array:', Array.isArray(data));
        
        // Handle different response formats
        let rolesList = [];
        if (Array.isArray(data)) {
          rolesList = data;
        } else if (data && Array.isArray(data.data)) {
          rolesList = data.data;
        } else if (data && typeof data === 'object') {
          // Try to extract array from object
          const keys = Object.keys(data);
          console.log('[UsersGrid] Response keys:', keys);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              rolesList = data[key];
              break;
            }
          }
        }
        
        console.log('[UsersGrid] Parsed roles list:', rolesList);
        console.log('[UsersGrid] Roles count:', rolesList.length);
        
        // Log each role to see structure
        if (rolesList.length > 0) {
          console.log('[UsersGrid] First role sample:', rolesList[0]);
          rolesList.forEach((role, idx) => {
            console.log(`[UsersGrid] Role ${idx}:`, {
              RoleId: role.RoleId || role.roleId,
              RoleName: role.RoleName || role.roleName,
              IsActive: role.IsActive !== undefined ? role.IsActive : role.isActive
            });
          });
        }
        
        setRoles(rolesList);
        if (rolesList.length === 0) {
          console.warn('[UsersGrid] No roles found. Check if roles table exists and has data.');
          console.warn('[UsersGrid] Response was:', JSON.stringify(data, null, 2));
          console.warn('[UsersGrid] API URL was: /api/Roles');
        } else {
          console.log(`[UsersGrid] Successfully loaded ${rolesList.length} roles`);
          console.log('[UsersGrid] Roles state updated:', rolesList);
        }
      })
      .catch(err => {
        console.error('[UsersGrid] Error loading roles:', err);
        console.error('[UsersGrid] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(`Failed to load roles: ${err.message}`);
      })
      .finally(() => {
        setRolesLoading(false);
      });
  }, []);

  // Load roles for dropdown on component mount
  useEffect(() => {
    loadRoles(true); // Include inactive roles
  }, [loadRoles]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const params = {
      page,
      pageSize,
      ...(search ? { search } : {}),
      ...(isActiveFilter !== null ? { isActive: isActiveFilter } : {}),
      ...(roleIdFilter ? { roleId: roleIdFilter } : {}),
    };

    getUsers(params)
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!isMounted) return;
        setUsers(list);
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
        setError(err.message || 'Failed to load users');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [search, isActiveFilter, roleIdFilter, page, pageSize]);

  /**
   * handleRowDoubleClick
   * Purpose: Load the selected user's details and open the modal.
   */
  const handleRowDoubleClick = async (id) => {
    const uid = String(id || '').trim();
    if (!uid) return;
    setSelectedId(uid);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    setCreateMode(false);
    try {
      const data = await getUser(uid);
      setDetail(data);
      const normalized = {
        UserId: data.UserId ?? data.userId ?? uid,
        FullName: data.FullName ?? data.fullName ?? '',
        Email: data.Email ?? data.email ?? '',
        RoleId: data.RoleId ?? data.roleId ?? '',
        IsActive: data.IsActive ?? data.isActive ?? true,
        Password: '', // Don't populate password
      };
      setForm(normalized);
      setEditMode(false);
    } catch (e) {
      setDetailError(e.message || 'Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * handleCreateClick
   * Purpose: Open modal in create mode.
   */
  const handleCreateClick = () => {
    setSelectedId(null);
    setDetail(null);
    setCreateMode(true);
    setEditMode(false);
    setForm({
      FullName: '',
      Email: '',
      Password: '',
      RoleId: '',
      IsActive: true,
    });
    // Ensure roles are loaded when opening create modal
    console.log('[UsersGrid] Create modal opened, roles count:', roles.length, 'loading:', rolesLoading);
    if (roles.length === 0 && !rolesLoading) {
      console.log('[UsersGrid] No roles found, reloading from API...');
      loadRoles(true);
    }
  };

  /**
   * handleEditToggle
   * Purpose: Toggle the edit mode on the user detail modal.
   */
  const handleEditToggle = () => {
    setEditMode((prev) => !prev);
    setSaveError('');
  };

  /**
   * handleFormChange
   * Purpose: Update local form state on input change for edit fields.
   */
  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * handleDelete
   * Purpose: Delete a user after confirmation.
   */
  const handleDelete = async (userId) => {
    const uid = String(userId || '').trim();
    if (!uid) return;

    const userName = users.find(u => (u.UserId || u.userId || u.id) === uid)?.FullName || uid;
    if (!window.confirm(`Are you sure you want to delete user "${userName}" (${uid})? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUser(uid);
      // Remove from list
      setUsers((prev) => prev.filter((u) => {
        const id = u.UserId || u.userId || u.id;
        return String(id) !== String(uid);
      }));
      // Close modal if this user was selected
      if (selectedId === uid) {
        setSelectedId(null);
        setDetail(null);
        setEditMode(false);
        setForm(null);
      }
      // Update total count
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      setDeleteError(e.message || 'Failed to delete user');
      console.error('[UsersGrid] Error deleting user:', e);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * handleSave
   * Purpose: Persist user updates via API and refresh local state.
   */
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError('');
    try {
      if (createMode) {
        // Create new user - ensure all required fields are present
        const payload = {
          FullName: (form.FullName?.trim() || '').trim(),
          Email: (form.Email?.trim() || '').trim(),
          Password: form.Password || '',
          IsActive: form.IsActive ?? true,
        };
        
        // Only include RoleId if it has a value (not empty string)
        if (form.RoleId && form.RoleId.trim()) {
          payload.RoleId = form.RoleId.trim();
        }
        
        console.log('[UsersGrid] Creating user with payload:', payload);
        try {
          const created = await createUser(payload);
          setDetail(created);
          setCreateMode(false);
          setEditMode(false);
        } catch (error) {
          console.error('[UsersGrid] Error creating user:', error);
          throw error; // Re-throw to be caught by outer catch
        }
        // Refresh the list
        const params = {
          page,
          pageSize,
          ...(search ? { search } : {}),
          ...(isActiveFilter !== null ? { isActive: isActiveFilter } : {}),
          ...(roleIdFilter ? { roleId: roleIdFilter } : {}),
        };
        const data = await getUsers(params);
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setUsers(list);
      } else if (selectedId) {
        // Update existing user
        const payload = {
          UserId: selectedId,
          FullName: form.FullName,
          Email: form.Email,
          RoleId: form.RoleId || null,
          IsActive: form.IsActive,
          ...(form.Password ? { Password: form.Password } : {}), // Only include password if provided
        };
        const updated = await updateUser(selectedId, payload);
        setDetail(updated);
        setEditMode(false);
        // Update the list view
        setUsers((prev) => prev.map((u) => {
          const id = u.UserId || u.userId || u.id;
          if (String(id) !== String(selectedId)) return u;
          return {
            ...u,
            UserId: updated.UserId ?? updated.userId ?? id,
            FullName: updated.FullName ?? updated.fullName ?? u.FullName ?? u.fullName,
            Email: updated.Email ?? updated.email ?? u.Email ?? u.email,
            RoleId: updated.RoleId ?? updated.roleId ?? u.RoleId ?? u.roleId,
            IsActive: updated.IsActive ?? updated.isActive ?? u.IsActive ?? u.isActive,
          };
        }));
      }
    } catch (e) {
      setSaveError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (routeFilter === 'Active') {
      list = list.filter(u => (u.IsActive === true || u.isActive === true));
    } else if (routeFilter === 'Inactive') {
      list = list.filter(u => (u.IsActive === false || u.isActive === false));
    }
    return list;
  }, [users, routeFilter]);

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <Title>{title}</Title>
          <Actions>
            <Input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              style={{ width: '200px', padding: '0.5rem' }}
            />
            <Select
              value={isActiveFilter === null ? '' : isActiveFilter.toString()}
              onChange={(e) => {
                setPage(1);
                setIsActiveFilter(e.target.value === '' ? null : e.target.value === 'true');
              }}
              aria-label="Active Status Filter"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Button $variant="primary" onClick={handleCreateClick}>New User</Button>
          </Actions>
        </HeaderLeft>
        <HeaderRight>
          <DetailText>Users Management</DetailText>
        </HeaderRight>
      </Header>

      {loading && <div>Loading users…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <Table>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <tr>
              <Th>User ID</Th>
              <Th>Full Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created At</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const userId = u.UserId || u.userId || u.id;
              const isActive = u.IsActive ?? u.isActive ?? true;
              return (
                <tr
                  key={userId}
                  onDoubleClick={() => handleRowDoubleClick(userId)}
                  style={{ cursor: 'pointer' }}
                  title="Double-click to open details"
                >
                  <Td>{toText(userId)}</Td>
                  <Td>{toText(u.FullName || u.fullName)}</Td>
                  <Td>{toText(u.Email || u.email)}</Td>
                  <Td>
                    {(() => {
                      const roleId = u.RoleId || u.roleId;
                      if (!roleId) return '—';
                      const role = roles.find(r => (r.RoleId || r.roleId) === roleId);
                      return role ? (role.RoleName || role.roleName) : roleId;
                    })()}
                  </Td>
                  <Td>
                    <StatusBadge status={isActive ? 'Active' : 'Inactive'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </Td>
                  <Td>
                    {u.CreatedAt || u.createdAt
                      ? new Date(u.CreatedAt || u.createdAt).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        $variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowDoubleClick(userId);
                        }}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                      >
                        View
                      </Button>
                      <Button
                        $variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(userId);
                        }}
                        disabled={deleting}
                        style={{ 
                          fontSize: '0.85rem', 
                          padding: '0.4rem 0.6rem',
                          background: deleting ? '#ccc' : '#d9534f',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan="7">No users found.</Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {!loading && !error && (
        <Footer>
          <div>
            Showing {filtered.length} of {totalCount} users
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

      {(selectedId || createMode) && (
        <ModalBackdrop onClick={() => { setSelectedId(null); setDetail(null); setCreateMode(false); setEditMode(false); setForm(null); }}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <span>{createMode ? 'Create New User' : `User Details — ${selectedId}`}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!createMode && (
                  <>
                    <Button $variant={editMode ? 'secondary' : 'primary'} onClick={handleEditToggle}>
                      {editMode ? 'Cancel Edit' : 'Edit'}
                    </Button>
                    <Button
                      $variant="secondary"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete user "${detail?.FullName || detail?.fullName || selectedId}"? This action cannot be undone.`)) {
                          handleDelete(selectedId);
                        }
                      }}
                      disabled={deleting}
                      style={{
                        background: deleting ? '#ccc' : '#d9534f',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                )}
                <CloseButton onClick={() => { setSelectedId(null); setDetail(null); setCreateMode(false); setEditMode(false); setForm(null); }}>Close</CloseButton>
              </div>
            </ModalHeader>
            <ModalBody>
              {detailLoading && <div>Loading details…</div>}
              {detailError && <div style={{ color: 'crimson' }}>{detailError}</div>}
              {deleteError && <div style={{ color: 'crimson', marginBottom: '1rem' }}>{deleteError}</div>}
              {!detailLoading && !detailError && (detail || createMode) && !editMode && !createMode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><strong>User ID:</strong> {toText(detail?.userId || detail?.UserId)}</div>
                  <div><strong>Full Name:</strong> {toText(detail?.fullName || detail?.FullName)}</div>
                  <div><strong>Email:</strong> {toText(detail?.email || detail?.Email)}</div>
                  <div>
                    <strong>Role:</strong> {
                      (() => {
                        const roleId = detail?.roleId || detail?.RoleId;
                        if (!roleId) return '—';
                        const role = roles.find(r => (r.RoleId || r.roleId) === roleId);
                        return role ? (role.RoleName || role.roleName) : roleId;
                      })()
                    }
                  </div>
                  <div><strong>Status:</strong> {(detail?.isActive ?? detail?.IsActive) ? 'Active' : 'Inactive'}</div>
                  <div><strong>Created At:</strong> {detail?.createdAt || detail?.CreatedAt ? new Date(detail.createdAt || detail.CreatedAt).toLocaleString() : '—'}</div>
                </div>
              )}
              {!detailLoading && !detailError && form && (editMode || createMode) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'Lexend, sans-serif' }}>
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={form.FullName}
                      onChange={(e) => handleFormChange('FullName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.Email}
                      onChange={(e) => handleFormChange('Email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>{createMode ? 'Password *' : 'Password (leave blank to keep current)'}</Label>
                    <Input
                      type="password"
                      value={form.Password}
                      onChange={(e) => handleFormChange('Password', e.target.value)}
                      required={createMode}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Label style={{ margin: 0 }}>Role</Label>
                      <button
                        onClick={() => {
                          console.log('[UsersGrid] Reloading roles...');
                          loadRoles(true);
                        }}
                        disabled={rolesLoading}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: rolesLoading ? '#ccc' : '#00234C',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: rolesLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Reload roles from API"
                      >
                        {rolesLoading ? '⏳' : '🔄'} {rolesLoading ? 'Loading...' : 'Reload'}
                      </button>
                    </div>
                    {rolesLoading ? (
                      <div style={{ padding: '0.5rem', color: '#666' }}>Loading roles...</div>
                    ) : (
                      <Select
                        value={form.RoleId || ''}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          console.log('[UsersGrid] Role selected:', val, 'from options:', roles.length);
                          handleFormChange('RoleId', val);
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}
                      >
                        <option value="">Select a role (Optional)</option>
                        {roles.length === 0 ? (
                          <option disabled>
                            {rolesLoading ? 'Loading roles...' : 'No roles available - Click Reload to refresh'}
                          </option>
                        ) : (
                          roles.map((role, index) => {
                            // Get roleid from API response (handles both PascalCase and camelCase)
                            const roleId = role.RoleId || role.roleId || '';
                            // Get rolename from API response for display
                            const roleName = role.RoleName || role.roleName || 'Unknown Role';
                            const isActive = role.IsActive !== undefined ? role.IsActive : (role.isActive !== undefined ? role.isActive : true);
                            const displayName = isActive ? roleName : `${roleName} (Inactive)`;
                            
                            // Debug log for each role
                            if (index === 0) {
                              console.log('[UsersGrid] Rendering first role option:', { roleId, roleName, displayName, fullRole: role });
                            }
                            
                            // Use roleid as the value (this is what gets saved to users.roleid)
                            if (!roleId) {
                              console.warn('[UsersGrid] Role missing roleId:', role);
                              return null;
                            }
                            
                            return (
                              <option key={roleId} value={roleId}>
                                {displayName}
                              </option>
                            );
                          }).filter(Boolean)
                        )}
                      </Select>
                    )}
                    {roles.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                        {roles.length} role(s) available
                      </div>
                    )}
                    {roles.length === 0 && !rolesLoading && (
                      <div style={{ fontSize: '0.75rem', color: '#d9534f', marginTop: '0.25rem' }}>
                        No roles found. Click Reload to refresh from API.
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.IsActive ? 'true' : 'false'}
                      onChange={(e) => handleFormChange('IsActive', e.target.value === 'true')}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #00234C', borderRadius: 4 }}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </div>

                  {saveError && <div style={{ gridColumn: '1 / -1', color: 'crimson' }}>{saveError}</div>}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button $variant="secondary" onClick={() => { setEditMode(false); setCreateMode(false); setForm(null); }}>Cancel</Button>
                    <Button $variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : createMode ? 'Create User' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
  );
}

