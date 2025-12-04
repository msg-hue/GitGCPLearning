import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getProjects, deleteProject } from '../utils/api';

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

// Modal and form styled components removed - using full-page ProjectFormPage instead

/**
 * ProjectsGrid
 * Purpose: Render projects list with filters, pagination, and CRUD actions.
 * Inputs:
 *  - title: string heading for the grid (e.g., 'Projects')
 * Outputs:
 *  - Table of projects with create/edit/delete modals and server-side pagination.
 */
export default function ProjectsGrid({ title = 'Projects' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

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
   * Purpose: Navigate to the project details page.
   * Inputs:
   *  - id: string project identifier
   * Outputs:
   *  - Navigates to the full-page project view.
   */
  const handleRowDoubleClick = (id) => {
    const pid = String(id || '').trim();
    if (!pid) return;
    navigate(`/property/projects/${pid}`);
  };

  /**
   * handleCreate
   * Purpose: Navigate to the create project page.
   * Outputs:
   *  - Navigates to the full-page create form.
   */
  const handleCreate = () => {
    navigate('/property/projects/new');
  };

  /**
   * handleEdit
   * Purpose: Navigate to the edit project page.
   * Inputs:
   *  - id: string project id
   * Outputs:
   *  - Navigates to the full-page edit form.
   */
  const handleEdit = (id) => {
    const pid = String(id || '').trim();
    if (!pid) return;
    navigate(`/property/projects/${pid}/edit`);
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
          <Button $variant="primary" onClick={handleCreate}>+ New Project</Button>
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
                  <SmallButton onClick={(e) => { e.stopPropagation(); handleEdit(proj.ProjectId || proj.projectId || proj.id); }}>Edit</SmallButton>
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

    </PageContainer>
  );
}
