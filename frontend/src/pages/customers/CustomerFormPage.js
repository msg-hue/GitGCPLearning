import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { getCustomer, createCustomer, updateCustomer, deleteCustomer, getPayments, getAllotments } from '../../utils/api';

/**
 * CustomerFormPage
 * Purpose: Full-page form for Add, Edit, and Display customer data.
 * Features 4 tabs: Customer Details, Allotment Information, Payment Details, History Details.
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
  max-width: 1200px;
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
  background: ${props => props.$active ? 'rgba(220, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.15)'};
  border: 1px solid ${props => props.$active ? 'rgba(220, 38, 38, 1)' : 'rgba(255, 255, 255, 0.3)'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$active ? 'rgba(185, 28, 28, 0.95)' : 'rgba(255, 255, 255, 0.25)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
`;

const Tab = styled.button`
  padding: 1rem 1.5rem;
  background: ${props => props.$active ? '#fff' : 'transparent'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #dd9c6b' : '3px solid transparent'};
  color: ${props => props.$active ? '#1a365d' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active ? '#fff' : '#e2e8f0'};
    color: #1a365d;
  }
`;

const FormBody = styled.div`
  padding: 2rem;
  min-height: 500px;
  
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  
  .full-width {
    grid-column: 1 / -1;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
  
  &:disabled {
    background: #f1f5f9;
    color: #64748b;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  transition: all 0.2s;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
  
  &:disabled {
    background: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
  
  &:disabled {
    background: #f1f5f9;
    color: #64748b;
  }
`;

const Value = styled.div`
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  min-height: 44px;
  display: flex;
  align-items: center;
  word-break: break-word;
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
  }
`;

const FooterActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #dd9c6b 0%, #c8845a 100%)';
    if (props.$variant === 'danger') return '#dc2626';
    return '#fff';
  }};
  color: ${props => props.$variant ? '#fff' : '#475569'};
  border: ${props => props.$variant ? 'none' : '1px solid #cbd5e1'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
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

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1a365d;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
`;

const InfoCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$status?.toLowerCase()) {
      case 'active': case 'allotted': case 'paid': return '#dcfce7';
      case 'blocked': case 'cancelled': case 'overdue': return '#fef2f2';
      case 'pending': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$status?.toLowerCase()) {
      case 'active': case 'allotted': case 'paid': return '#166534';
      case 'blocked': case 'cancelled': case 'overdue': return '#dc2626';
      case 'pending': return '#92400e';
      default: return '#475569';
    }
  }};
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tr:hover td {
    background: #fafbfc;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  
  h4 {
    margin: 0 0 0.75rem;
    color: #475569;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

const TABS = [
  { id: 'details', label: 'Customer Details', icon: '👤' },
  { id: 'allotment', label: 'Allotment Info', icon: '🏠' },
  { id: 'payments', label: 'Payment Details', icon: '💰' },
  { id: 'history', label: 'History', icon: '📋' },
];

const initialFormState = {
  CustomerId: '',
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
  CreatedAt: null,
};

export default function CustomerFormPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine mode from URL
  const isNew = location.pathname.endsWith('/new');
  const isEditRoute = location.pathname.endsWith('/edit');
  const mode = isNew ? 'create' : 'view';
  
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({ ...initialFormState });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(isNew || isEditRoute);
  
  // Related data
  const [allotments, setAllotments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allotmentsLoading, setAllotmentsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const normalizeCustomerData = (data) => ({
    CustomerId: data.CustomerId ?? data.customerId ?? '',
    RegId: data.RegId ?? data.regId ?? null,
    PlanId: data.PlanId ?? data.planId ?? null,
    FullName: data.FullName ?? data.fullName ?? '',
    FatherName: data.FatherName ?? data.fatherName ?? '',
    Cnic: data.Cnic ?? data.cnic ?? '',
    PassportNo: data.PassportNo ?? data.passportNo ?? '',
    CreatedAt: data.CreatedAt ?? data.createdAt ?? data.created_at ?? null,
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
    AllotmentStatus: data.AllotmentStatus ?? data.allotmentStatus ?? '',
  });

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getCustomer(customerId);
      const normalized = normalizeCustomerData(data);
      setForm(normalized);
      setOriginalData(data);
    } catch (e) {
      setError(e.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const loadAllotments = useCallback(async () => {
    if (!customerId) return;
    setAllotmentsLoading(true);
    try {
      const data = await getAllotments({ customerId });
      setAllotments(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load allotments:', e);
      setAllotments([]);
    } finally {
      setAllotmentsLoading(false);
    }
  }, [customerId]);

  const loadPayments = useCallback(async () => {
    if (!customerId) return;
    setPaymentsLoading(true);
    try {
      const data = await getPayments({ customerId });
      setPayments(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load payments:', e);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [customerId]);

  // Load customer data on mount
  useEffect(() => {
    if (customerId && mode !== 'create') {
      loadCustomerData();
    }
  }, [customerId, mode, loadCustomerData]);

  // Load related data when switching tabs
  useEffect(() => {
    if (customerId && activeTab === 'allotment' && allotments.length === 0) {
      loadAllotments();
    }
    if (customerId && activeTab === 'payments' && payments.length === 0) {
      loadPayments();
    }
  }, [activeTab, customerId, allotments.length, payments.length, loadAllotments, loadPayments]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.FullName || !form.Email) {
      setError('Full Name and Email are required');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (mode === 'create') {
        const result = await createCustomer({ ...form, CustomerId: null });
        setSuccess('Customer created successfully!');
        setTimeout(() => {
          navigate(`/customers/all-customers/${result.customerId || result.CustomerId}`);
        }, 1000);
      } else {
        await updateCustomer(customerId, { ...form, CustomerId: customerId });
        setSuccess('Customer updated successfully!');
        setEditMode(false);
        loadCustomerData();
      }
    } catch (e) {
      setError(e.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    
    try {
      await deleteCustomer(customerId);
      navigate('/customers/all-customers');
    } catch (e) {
      setError(e.message || 'Failed to delete customer');
    }
  };

  const toggleEditMode = () => {
    if (editMode && mode !== 'create') {
      // Cancel edit - restore original data
      if (originalData) {
        setForm(normalizeCustomerData(originalData));
      }
      setError('');
    }
    setEditMode(!editMode);
  };

  const handleBack = () => {
    navigate('/customers/all-customers');
  };

  const formatDate = (date) => {
    if (!date) return '—';
    if (typeof date === 'string') return date.slice(0, 10);
    return new Date(date).toISOString().slice(0, 10);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderField = (label, field, type = 'text', options = {}) => {
    const value = form[field] ?? '';
    const isReadOnly = !editMode;
    
    if (isReadOnly) {
      let displayValue = value;
      if (type === 'date' && value) {
        displayValue = formatDate(value);
      }
      return (
        <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
          <Label>{label}</Label>
          <Value>{displayValue || '—'}</Value>
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
            <option value="">Select...</option>
            {options.choices.map(c => (
              <option key={c} value={c}>{c}</option>
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
            rows={options.rows || 3}
          />
        </FieldGroup>
      );
    }
    
    return (
      <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
        <Label>{label} {options.required && <span style={{ color: '#dc2626' }}>*</span>}</Label>
        <Input
          type={type}
          value={type === 'date' && value ? formatDate(value) : value}
          onChange={(e) => handleChange(field, e.target.value || null)}
        />
      </FieldGroup>
    );
  };

  const renderCustomerDetailsTab = () => (
    <>
      {/* Customer Summary Card - Only show in view mode */}
      {!editMode && mode !== 'create' && (
        <InfoCard style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
          <FieldGrid>
            <div><Label style={{ color: '#0369a1' }}>Customer ID</Label><Value style={{ fontWeight: 600, background: 'transparent', border: 'none', padding: '0.5rem 0' }}>{form.CustomerId || '—'}</Value></div>
            <div><Label style={{ color: '#0369a1' }}>Status</Label><div style={{ paddingTop: '0.5rem' }}><StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge></div></div>
            <div><Label style={{ color: '#0369a1' }}>Allotment</Label><div style={{ paddingTop: '0.5rem' }}><StatusBadge $status={form.AllotmentStatus}>{form.AllotmentStatus || 'Not Set'}</StatusBadge></div></div>
            <div><Label style={{ color: '#0369a1' }}>Created Date</Label><Value style={{ background: 'transparent', border: 'none', padding: '0.5rem 0' }}>{formatDate(form.CreatedAt)}</Value></div>
          </FieldGrid>
        </InfoCard>
      )}
      
      <SectionTitle>👤 Personal Information</SectionTitle>
      <FieldGrid>
        {renderField('Full Name', 'FullName', 'text', { required: true })}
        {renderField('Father Name', 'FatherName')}
        {renderField('Email', 'Email', 'email', { required: true })}
        {renderField('Phone', 'Phone', 'tel')}
        {renderField('CNIC', 'Cnic')}
        {renderField('Passport No', 'PassportNo')}
        {renderField('Date of Birth', 'Dob', 'date')}
        {renderField('Gender', 'Gender', 'select', { choices: ['Male', 'Female', 'Other'] })}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '2rem' }}>📍 Address Information</SectionTitle>
      <FieldGrid>
        {renderField('Permanent Address', 'PermanentAddress', 'textarea', { fullWidth: true })}
        {renderField('Mailing Address', 'MailingAddress', 'textarea', { fullWidth: true })}
        {renderField('City', 'City')}
        {renderField('Country', 'Country')}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '2rem' }}>📋 Registration & Property Details</SectionTitle>
      <FieldGrid>
        {renderField('Registration ID', 'RegId')}
        {renderField('Payment Plan ID', 'PlanId')}
        {renderField('Sub Project', 'SubProject')}
        {renderField('Registered Size', 'RegisteredSize')}
        {renderField('Status', 'Status', 'select', { choices: ['Active', 'Blocked', 'Cancelled'] })}
        {renderField('Allotment Status', 'AllotmentStatus', 'select', { choices: ['Allotted', 'Not Allotted', 'Pending'] })}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '2rem' }}>👥 Nominee Information</SectionTitle>
      <FieldGrid>
        {renderField('Nominee Name', 'NomineeName')}
        {renderField('Nominee CNIC/ID', 'NomineeId')}
        {renderField('Relationship', 'NomineeRelation')}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '2rem' }}>📝 Additional Information</SectionTitle>
      <FieldGrid>
        {renderField('Additional Notes', 'AdditionalInfo', 'textarea', { fullWidth: true, rows: 3 })}
      </FieldGrid>
    </>
  );

  const renderAllotmentTab = () => {
    if (mode === 'create') {
      return (
        <EmptyState>
          <h4>🏠 Allotment Information</h4>
          <p>Allotment details will be available after the customer is created.</p>
        </EmptyState>
      );
    }
    
    if (allotmentsLoading) {
      return <LoadingSpinner>Loading allotment details...</LoadingSpinner>;
    }
    
    if (allotments.length === 0) {
      return (
        <EmptyState>
          <h4>🏠 Not Allotted</h4>
          <p>This customer has no allotment records.</p>
        </EmptyState>
      );
    }
    
    return (
      <>
        <SectionTitle>🏠 Allotment Records</SectionTitle>
        <DataTable>
          <thead>
            <tr>
              <th>Allotment ID</th>
              <th>Unit/Plot</th>
              <th>Project</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allotments.slice(0, 20).map((a, idx) => (
              <tr key={a.AllotmentId || a.allotmentId || idx}>
                <td>{a.AllotmentId || a.allotmentId || '—'}</td>
                <td>{a.UnitId || a.unitId || a.PlotNo || a.plotNo || '—'}</td>
                <td>{a.ProjectId || a.projectId || '—'}</td>
                <td>{formatDate(a.AllotmentDate || a.allotmentDate)}</td>
                <td>
                  <StatusBadge $status={a.Status || a.status}>
                    {a.Status || a.status || 'Unknown'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </>
    );
  };

  const renderPaymentsTab = () => {
    if (mode === 'create') {
      return (
        <EmptyState>
          <h4>💰 Payment Details</h4>
          <p>Payment details will be available after the customer is created.</p>
        </EmptyState>
      );
    }
    
    if (paymentsLoading) {
      return <LoadingSpinner>Loading payment details...</LoadingSpinner>;
    }
    
    if (payments.length === 0) {
      return (
        <EmptyState>
          <h4>💰 No Payments</h4>
          <p>This customer has no payment records.</p>
        </EmptyState>
      );
    }
    
    return (
      <>
        <SectionTitle>💰 Payment Records</SectionTitle>
        <DataTable>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 20).map((p, idx) => (
              <tr key={p.PaymentId || p.paymentId || idx}>
                <td>{p.PaymentId || p.paymentId || '—'}</td>
                <td>{formatDate(p.PaymentDate || p.paymentDate)}</td>
                <td>{formatCurrency(p.Amount || p.amount)}</td>
                <td>{p.Method || p.method || '—'}</td>
                <td>{p.ReferenceNo || p.referenceNo || '—'}</td>
                <td>
                  <StatusBadge $status={p.Status || p.status}>
                    {p.Status || p.status || 'Unknown'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {payments.length > 20 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
            Showing 20 of {payments.length} payments
          </div>
        )}
      </>
    );
  };

  const renderHistoryTab = () => {
    if (mode === 'create') {
      return (
        <EmptyState>
          <h4>📋 History Details</h4>
          <p>Activity history will be available after the customer is created.</p>
        </EmptyState>
      );
    }
    
    return (
      <>
        <SectionTitle>📋 Customer Record Information</SectionTitle>
        <InfoCard>
          <FieldGrid>
            <div><Label>Customer ID</Label><Value style={{ fontWeight: 600 }}>{form.CustomerId || '—'}</Value></div>
            <div><Label>Created At</Label><Value>{formatDate(form.CreatedAt)}</Value></div>
            <div><Label>Current Status</Label><div style={{ paddingTop: '0.5rem' }}><StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge></div></div>
            <div><Label>Allotment Status</Label><div style={{ paddingTop: '0.5rem' }}><StatusBadge $status={form.AllotmentStatus}>{form.AllotmentStatus || 'Not Set'}</StatusBadge></div></div>
          </FieldGrid>
        </InfoCard>
        
        <SectionTitle style={{ marginTop: '1.5rem' }}>📜 Activity Log</SectionTitle>
        <EmptyState>
          <p>Detailed activity logs are not currently available.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#94a3b8' }}>Future updates will include edit history, status changes, and user actions.</p>
        </EmptyState>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return renderCustomerDetailsTab();
      case 'allotment':
        return renderAllotmentTab();
      case 'payments':
        return renderPaymentsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (mode === 'create') return 'Create New Customer';
    if (editMode) return `Edit: ${form.FullName || 'Customer'}`;
    return form.FullName || 'Customer Details';
  };

  return (
    <PageContainer>
      <FormCard>
        <FormHeader>
          <HeaderTitle>
            <Title>{getTitle()}</Title>
            {customerId && <Subtitle>ID: {customerId}</Subtitle>}
          </HeaderTitle>
          <HeaderActions>
            <IconButton onClick={handleBack}>
              ← Back to List
            </IconButton>
            {mode !== 'create' && (
              <IconButton onClick={toggleEditMode} $active={editMode}>
                {editMode ? '✕ Cancel Edit' : '✎ Edit Customer'}
              </IconButton>
            )}
          </HeaderActions>
        </FormHeader>
        
        <TabsContainer>
          {TABS.map(tab => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </Tab>
          ))}
        </TabsContainer>
        
        <FormBody>
          {loading ? (
            <LoadingSpinner>Loading customer data...</LoadingSpinner>
          ) : (
            <>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              {renderTabContent()}
            </>
          )}
        </FormBody>
        
        <FormFooter>
          <div>
            {editMode && mode !== 'create' && customerId && (
              <Button $variant="danger" onClick={handleDelete}>
                🗑 Delete Customer
              </Button>
            )}
          </div>
          <FooterActions>
            <Button onClick={handleBack}>Cancel</Button>
            {editMode && (
              <Button $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (mode === 'create' ? '✓ Create Customer' : '✓ Save Changes')}
              </Button>
            )}
          </FooterActions>
        </FormFooter>
      </FormCard>
    </PageContainer>
  );
}

