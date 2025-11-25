import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getProjects, getProject, createProject, updateProject, deleteProject } from '../utils/api';

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
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Input = styled.input`
  padding: 0.4rem 0.5rem;
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.4rem 0.5rem;
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
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
  width: 780px;
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  color: ${p => p.theme.colors.secondary};
`;

const Field = styled.input`
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid ${p => p.theme.colors.secondary};
  border-radius: 4px;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

/**
 * ProjectsGrid
 * Purpose: Render projects list with filters, pagination, and CRUD actions.
 * Inputs:
 *  - title: string heading for the grid (e.g., 'Projects')
 * Outputs:
 *  - Table of projects with create/edit/delete modals and server-side pagination.
 */
export default function ProjectsGrid({ title = 'Projects' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    const params = {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize,
    };
    getProjects(params)
      .then(data => {
        console.log('[ProjectsGrid] API response:', data);
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!isMounted) return;
        setProjects(list);
        const tc = typeof data?.totalCount === 'number' ? data.totalCount : list.length;
        const pg = typeof data?.page === 'number' ? data.page : page;
        const ps = typeof data?.pageSize === 'number' ? data.pageSize : pageSize;
        const tp = typeof data?.totalPages === 'number' ? data.totalPages : Math.max(1, Math.ceil(tc / ps));
        setTotalCount(tc);
        setPage(pg);
        setPageSize(ps);
        setTotalPages(tp);
        console.log('[ProjectsGrid] Loaded', list.length, 'projects');
      })
      .catch(err => {
        console.error('[ProjectsGrid] Error loading projects:', err);
        if (!isMounted) return;
        const errorMsg = err.message || 'Failed to load projects';
        setError(errorMsg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [typeFilter, search, page, pageSize]);

  /**
   * handleRowDoubleClick
   * Purpose: Load the selected project's details and open the modal.
   * Inputs:
   *  - id: string project identifier
   * Outputs:
   *  - Populates detail state and sets selectedId for the modal.
   */
  const handleRowDoubleClick = async (id) => {
    const pid = String(id || '').trim();
    if (!pid) return;
    setSelectedId(pid);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await getProject(pid);
      setDetail(data);
    } catch (e) {
      setDetailError(e.message || 'Failed to load project details');
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * handleCreate
   * Purpose: Create a new project using form data.
   * Inputs:
   *  - payload: object with project fields
   * Outputs:
   *  - Creates project and refreshes the grid.
   */
  const handleCreate = async (payload) => {
    try {
      await createProject(payload);
      setShowCreate(false);
      setPage(1);
    } catch (e) {
      alert(e.message || 'Failed to create project');
    }
  };

  /**
   * handleUpdate
   * Purpose: Update an existing project.
   * Inputs:
   *  - id: string project id
   *  - payload: object of updated fields
   * Outputs:
   *  - Updates project and refreshes the grid.
   */
  const handleUpdate = async (id, payload) => {
    try {
      await updateProject(id, { ...payload, ProjectId: id });
      setEditData(null);
      setPage(page); // reload current page
    } catch (e) {
      alert(e.message || 'Failed to update project');
    }
  };

  /**
   * handleDelete
   * Purpose: Delete a project by id.
   * Inputs:
   *  - id: string project id
   * Outputs:
   *  - Deletes project and refreshes the grid.
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setPage(1);
    } catch (e) {
      alert(e.message || 'Failed to delete project');
    }
  };

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <Actions>
            <Select
              value={typeFilter}
              onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
              aria-label="Type Filter"
            >
              <option value="">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed">Mixed</option>
            </Select>
            <Input
              value={search}
              placeholder="Search (name, location)"
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              aria-label="Search Projects"
            />
          </Actions>
        </HeaderLeft>
        <HeaderRight>
          <Button $variant="primary" onClick={() => setShowCreate(true)}>New Project</Button>
        </HeaderRight>
      </Header>

      {loading && <div>Loading projects…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <Table>
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <Th>Project ID</Th>
              <Th>Project Name</Th>
              <Th>Type</Th>
              <Th>Location</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr
                key={proj.ProjectId || proj.projectId || proj.id}
                onDoubleClick={() => handleRowDoubleClick(proj.ProjectId || proj.projectId || proj.id)}
                style={{ cursor: 'pointer' }}
                title="Double-click to open details"
              >
                <Td>{proj.ProjectId || proj.projectId || proj.id}</Td>
                <Td>{proj.ProjectName || proj.projectName || '—'}</Td>
                <Td>{proj.Type || proj.type || '—'}</Td>
                <Td>{proj.Location || proj.location || '—'}</Td>
                <Td>
                  <SmallButton onClick={(e) => { e.stopPropagation(); setEditData(proj); }}>Edit</SmallButton>
                  {' '}
                  <SmallButton onClick={(e) => { e.stopPropagation(); handleDelete(proj.ProjectId || proj.projectId || proj.id); }}>Delete</SmallButton>
                </Td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <Td colSpan="5">No projects found.</Td>
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

      {selectedId && (
        <ModalBackdrop onClick={() => { setSelectedId(null); setDetail(null); }}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <span>Project Details — {selectedId}</span>
              <CloseButton onClick={() => { setSelectedId(null); setDetail(null); }}>Close</CloseButton>
            </ModalHeader>
            <ModalBody>
              {detailLoading && <div>Loading details…</div>}
              {detailError && <div style={{ color: 'crimson' }}>{detailError}</div>}
              {!detailLoading && !detailError && detail && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><strong>ID:</strong> {detail.projectId || detail.ProjectId}</div>
                  <div><strong>Name:</strong> {detail.projectName || detail.ProjectName}</div>
                  <div><strong>Type:</strong> {detail.type || detail.Type}</div>
                  <div><strong>Location:</strong> {detail.location || detail.Location}</div>
                  <div><strong>Description:</strong> {detail.description || detail.Description || '—'}</div>
                  <div><strong>Status:</strong> {detail.status || detail.Status || '—'}</div>
                </div>
              )}
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showCreate && (
        <ModalBackdrop onClick={() => setShowCreate(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <span>New Project</span>
              <CloseButton onClick={() => setShowCreate(false)}>Close</CloseButton>
            </ModalHeader>
            <ModalBody>
              <ProjectForm onSubmit={handleCreate} />
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}

      {editData && (
        <ModalBackdrop onClick={() => setEditData(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <span>Edit Project — {editData.ProjectId || editData.projectId}</span>
              <CloseButton onClick={() => setEditData(null)}>Close</CloseButton>
            </ModalHeader>
            <ModalBody>
              <ProjectForm
                initial={editData}
                onSubmit={(payload) => handleUpdate(editData.ProjectId || editData.projectId, payload)}
              />
            </ModalBody>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
  );
}

/**
 * ProjectForm
 * Purpose: Controlled form for creating/updating projects.
 * Inputs:
 *  - initial: optional initial values for editing
 *  - onSubmit: function to call with form payload
 * Outputs:
 *  - Emits payload with normalized keys matching backend model.
 */
function ProjectForm({ initial, onSubmit }) {
  const [form, setForm] = useState({
    ProjectName: initial?.ProjectName || initial?.projectName || '',
    Type: initial?.Type || initial?.type || '',
    Location: initial?.Location || initial?.location || '',
    Description: initial?.Description || initial?.description || '',
    Status: initial?.Status || initial?.status || 'Active',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <FormGrid>
        <div>
          <Label>Project Name</Label>
          <Field value={form.ProjectName} onChange={set('ProjectName')} required />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.Type} onChange={set('Type')}>
            <option value="">Select Type</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Mixed">Mixed</option>
          </Select>
        </div>
        <div>
          <Label>Location</Label>
          <Field value={form.Location} onChange={set('Location')} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.Status} onChange={set('Status')}>
            <option value="Active">Active</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </Select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Description</Label>
          <Field value={form.Description} onChange={set('Description')} />
        </div>
      </FormGrid>
      <ActionsRow>
        <Button type="submit" $variant="primary">Save</Button>
      </ActionsRow>
    </form>
  );
}
