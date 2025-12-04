import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { getProject, createProject, updateProject, deleteProject } from '../../utils/api';

/**
 * ProjectFormPage
 * Purpose: Full-page form for Add, Edit, and Display project data.
 * Replaces modal-based form for better visibility and usability.
 */

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem;
  font-family: 'Lexend', sans-serif;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FormCard = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const FormHeader = styled.div`
  background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.span`
  font-size: 0.85rem;
  opacity: 0.85;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormBody = styled.div`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #1a365d;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
  
  &:read-only {
    cursor: default;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: ${props => props.disabled ? '#f8fafc' : '#fff'};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
`;

const Value = styled.div`
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  min-height: 44px;
  display: flex;
  align-items: center;
`;

const FormFooter = styled.div`
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
    flex-direction: column;
  }
`;

const FooterActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #dd9c6b 0%, #c8845a 100%)';
    if (props.$variant === 'danger') return '#dc2626';
    if (props.$variant === 'success') return '#059669';
    return '#fff';
  }};
  color: ${props => props.$variant ? '#fff' : '#475569'};
  border: ${props => props.$variant ? 'none' : '2px solid #cbd5e1'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled.div`
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #059669;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;
  font-size: 1rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$status?.toLowerCase()) {
      case 'active': return '#dcfce7';
      case 'completed': return '#dbeafe';
      case 'on hold': return '#fef3c7';
      case 'planned': return '#f3e8ff';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$status?.toLowerCase()) {
      case 'active': return '#166534';
      case 'completed': return '#1e40af';
      case 'on hold': return '#92400e';
      case 'planned': return '#7e22ce';
      default: return '#475569';
    }
  }};
`;

const InfoCard = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
`;

const initialFormState = {
  ProjectName: '',
  Type: '',
  Location: '',
  Description: '',
  Status: 'Active',
};

export default function ProjectFormPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine mode from URL path
  const isCreateMode = location.pathname.includes('/new');
  const isEditMode = location.pathname.includes('/edit');
  const isViewMode = !isCreateMode && !isEditMode && projectId;
  
  const [form, setForm] = useState({ ...initialFormState });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(isCreateMode || isEditMode);

  // Load project data when viewing/editing
  useEffect(() => {
    if (projectId && !isCreateMode) {
      loadProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isCreateMode]);

  const loadProjectData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProject(projectId);
      const normalized = normalizeProjectData(data);
      setForm(normalized);
      setOriginalData(data);
    } catch (e) {
      setError(e.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const normalizeProjectData = (data) => ({
    ProjectId: data.ProjectId ?? data.projectId ?? '',
    ProjectName: data.ProjectName ?? data.projectName ?? '',
    Type: data.Type ?? data.type ?? '',
    Location: data.Location ?? data.location ?? '',
    Description: data.Description ?? data.description ?? '',
    Status: data.Status ?? data.status ?? 'Active',
    CreatedAt: data.CreatedAt ?? data.createdAt ?? null,
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!form.ProjectName.trim()) {
      setError('Project Name is required');
      return false;
    }
    if (!form.Type) {
      setError('Project Type is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (isCreateMode) {
        const result = await createProject(form);
        setSuccess('Project created successfully!');
        // Navigate to the new project's view page after a short delay
        setTimeout(() => {
          const newId = result.ProjectId || result.projectId;
          if (newId) {
            navigate(`/property/projects/${newId}`, { replace: true });
          } else {
            navigate('/property/projects', { replace: true });
          }
        }, 1500);
      } else {
        await updateProject(projectId, { ...form, ProjectId: projectId });
        setSuccess('Project updated successfully!');
        setEditMode(false);
        // Reload the data
        await loadProjectData();
      }
    } catch (e) {
      setError(e.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      await deleteProject(projectId);
      setSuccess('Project deleted successfully!');
      setTimeout(() => {
        navigate('/property/projects', { replace: true });
      }, 1500);
    } catch (e) {
      setError(e.message || 'Failed to delete project');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate('/property/projects');
    } else if (editMode) {
      // Restore original data
      if (originalData) {
        setForm(normalizeProjectData(originalData));
      }
      setEditMode(false);
      setError('');
    } else {
      navigate('/property/projects');
    }
  };

  const toggleEditMode = () => {
    if (editMode && !isCreateMode) {
      // Cancel edit
      if (originalData) {
        setForm(normalizeProjectData(originalData));
      }
    }
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };

  const formatDate = (date) => {
    if (!date) return '—';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderField = (label, field, type = 'text', options = {}) => {
    const value = form[field] ?? '';
    const isReadOnly = !editMode;
    
    if (isReadOnly) {
      if (field === 'Status') {
        return (
          <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
            <Label>{label}</Label>
            <Value>
              <StatusBadge $status={value}>{value || '—'}</StatusBadge>
            </Value>
          </FieldGroup>
        );
      }
      return (
        <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
          <Label>{label}</Label>
          <Value>{value || '—'}</Value>
        </FieldGroup>
      );
    }
    
    if (type === 'select' && options.choices) {
      return (
        <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
          <Label>{label} {options.required && <span style={{ color: '#dc2626' }}>*</span>}</Label>
          <Select
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
          >
            <option value="">Select {label}...</option>
            {options.choices.map(c => (
              <option key={c.value || c} value={c.value || c}>{c.label || c}</option>
            ))}
          </Select>
        </FieldGroup>
      );
    }
    
    if (type === 'textarea') {
      return (
        <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
          <Label>{label}</Label>
          <Textarea
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            rows={options.rows || 4}
            placeholder={options.placeholder || `Enter ${label.toLowerCase()}...`}
          />
        </FieldGroup>
      );
    }
    
    return (
      <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
        <Label>{label} {options.required && <span style={{ color: '#dc2626' }}>*</span>}</Label>
        <Input
          type={type}
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={options.placeholder || `Enter ${label.toLowerCase()}...`}
        />
      </FieldGroup>
    );
  };

  const getTitle = () => {
    if (isCreateMode) return 'Create New Project';
    if (editMode) return 'Edit Project';
    return 'Project Details';
  };

  const getSubtitle = () => {
    if (isCreateMode) return 'Fill in the details below to create a new project';
    if (projectId) return `Project ID: ${projectId}`;
    return '';
  };

  return (
    <PageContainer>
      <FormCard>
        <FormHeader>
          <HeaderTitle>
            <Title>{getTitle()}</Title>
            <Subtitle>{getSubtitle()}</Subtitle>
          </HeaderTitle>
          <HeaderActions>
            {!isCreateMode && !editMode && (
              <IconButton onClick={toggleEditMode}>
                ✎ Edit
              </IconButton>
            )}
            {editMode && !isCreateMode && (
              <IconButton onClick={toggleEditMode}>
                ✕ Cancel Edit
              </IconButton>
            )}
            <IconButton onClick={() => navigate('/property/projects')}>
              ← Back to List
            </IconButton>
          </HeaderActions>
        </FormHeader>
        
        <FormBody>
          {loading ? (
            <LoadingSpinner>Loading project data...</LoadingSpinner>
          ) : (
            <>
              {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}
              {success && <SuccessMessage>✓ {success}</SuccessMessage>}
              
              {/* Project Info Card - Only show when viewing existing project */}
              {!isCreateMode && originalData && !editMode && (
                <InfoCard>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>Project ID</InfoLabel>
                      <InfoValue>{form.ProjectId || projectId}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Status</InfoLabel>
                      <InfoValue>
                        <StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge>
                      </InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Type</InfoLabel>
                      <InfoValue>{form.Type || '—'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Created</InfoLabel>
                      <InfoValue>{formatDate(form.CreatedAt)}</InfoValue>
                    </InfoItem>
                  </InfoGrid>
                </InfoCard>
              )}
              
              {/* Basic Information */}
              <SectionTitle>📋 Basic Information</SectionTitle>
              <FieldGrid>
                {renderField('Project Name', 'ProjectName', 'text', { required: true, placeholder: 'Enter project name' })}
                {renderField('Type', 'Type', 'select', { 
                  required: true,
                  choices: [
                    { value: 'Residential', label: 'Residential' },
                    { value: 'Commercial', label: 'Commercial' },
                    { value: 'Mixed', label: 'Mixed Use' },
                    { value: 'Industrial', label: 'Industrial' },
                  ]
                })}
                {renderField('Location', 'Location', 'text', { placeholder: 'Enter project location' })}
                {renderField('Status', 'Status', 'select', { 
                  choices: [
                    { value: 'Active', label: 'Active' },
                    { value: 'Planned', label: 'Planned' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'On Hold', label: 'On Hold' },
                  ]
                })}
              </FieldGrid>
              
              {/* Description */}
              <SectionTitle>📝 Description</SectionTitle>
              <FieldGrid>
                {renderField('Description', 'Description', 'textarea', { 
                  fullWidth: true,
                  rows: 5,
                  placeholder: 'Enter a detailed description of the project...'
                })}
              </FieldGrid>
            </>
          )}
        </FormBody>
        
        <FormFooter>
          <div>
            {!isCreateMode && editMode && (
              <Button $variant="danger" onClick={handleDelete} disabled={saving}>
                🗑 Delete Project
              </Button>
            )}
          </div>
          <FooterActions>
            <Button onClick={handleCancel} disabled={saving}>
              {isCreateMode ? '← Cancel' : editMode ? '✕ Cancel' : '← Back'}
            </Button>
            {editMode && (
              <Button $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (isCreateMode ? '+ Create Project' : '✓ Save Changes')}
              </Button>
            )}
          </FooterActions>
        </FormFooter>
      </FormCard>
    </PageContainer>
  );
}

