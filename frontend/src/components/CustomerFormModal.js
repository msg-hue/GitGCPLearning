import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getCustomer, createCustomer, updateCustomer, deleteCustomer, getPayments, getAllotments } from '../utils/api';

/**
 * CustomerFormModal
 * Purpose: A tabbed modal for Add, Update, and Display customer data.
 * Features 4 tabs: Customer Details, Allotment Information, Payment Details, History Details.
 */

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  width: 900px;
  max-width: 95vw;
  height: 85vh;
  max-height: 700px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Lexend', sans-serif;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Subtitle = styled.span`
  font-size: 0.8rem;
  opacity: 0.85;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const IconButton = styled.button`
  background: ${props => props.$active ? 'rgba(220, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.2)'};
  border: 1px solid ${props => props.$active ? 'rgba(220, 38, 38, 1)' : 'rgba(255, 255, 255, 0.4)'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? 'rgba(185, 28, 28, 0.95)' : 'rgba(255, 255, 255, 0.35)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.85rem 1rem;
  background: ${props => props.$active ? '#fff' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#dd9c6b' : 'transparent'};
  color: ${props => props.$active ? '#1a365d' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  
  &:hover {
    background: ${props => props.$active ? '#fff' : '#f1f5f9'};
    color: #1a365d;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background: #fff;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
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
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
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
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  
  &:focus {
    outline: none;
    border-color: #dd9c6b;
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.15);
  }
`;

const Value = styled.div`
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  min-height: 38px;
  display: flex;
  align-items: center;
  word-break: break-word;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const FooterActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #dd9c6b 0%, #c8845a 100%)';
    if (props.$variant === 'danger') return '#dc2626';
    return '#fff';
  }};
  color: ${props => props.$variant ? '#fff' : '#475569'};
  border: ${props => props.$variant ? 'none' : '1px solid #cbd5e1'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #64748b;
  
  h4 {
    margin: 0 0 0.5rem;
    color: #475569;
  }
  
  p {
    margin: 0;
    font-size: 0.85rem;
  }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  
  th, td {
    padding: 0.65rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tr:hover td {
    background: #fafbfc;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
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

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a365d;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
`;

const InfoCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
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

export default function CustomerFormModal({
  mode = 'view', // 'view' | 'edit' | 'create'
  customerId = null,
  onClose,
  onSave,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({ ...initialFormState });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(mode === 'create' || mode === 'edit');
  
  // Related data
  const [allotments, setAllotments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allotmentsLoading, setAllotmentsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Load customer data when viewing/editing existing customer
  useEffect(() => {
    if (customerId && mode !== 'create') {
      loadCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, mode]);

  // Load related data when switching to those tabs
  useEffect(() => {
    if (customerId && activeTab === 'allotment' && allotments.length === 0) {
      loadAllotments();
    }
    if (customerId && activeTab === 'payments' && payments.length === 0) {
      loadPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerId]);

  const loadCustomerData = async () => {
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
  };

  const loadAllotments = async () => {
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
  };

  const loadPayments = async () => {
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
  };

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
    
    try {
      if (mode === 'create') {
        const result = await createCustomer({ ...form, CustomerId: null });
        if (onSave) onSave(result);
      } else {
        const result = await updateCustomer(customerId, { ...form, CustomerId: customerId });
        if (onSave) onSave(result);
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await deleteCustomer(customerId);
      if (onDelete) onDelete(customerId);
      onClose();
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
    }
    setEditMode(!editMode);
    setError('');
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
            rows={options.rows || 2}
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
        <InfoCard style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
          <FieldGrid>
            <div><Label style={{ color: '#0369a1' }}>Customer ID</Label><Value style={{ fontWeight: 600 }}>{form.CustomerId || '—'}</Value></div>
            <div><Label style={{ color: '#0369a1' }}>Status</Label><Value><StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge></Value></div>
            <div><Label style={{ color: '#0369a1' }}>Allotment</Label><Value><StatusBadge $status={form.AllotmentStatus}>{form.AllotmentStatus || 'Not Set'}</StatusBadge></Value></div>
            <div><Label style={{ color: '#0369a1' }}>Created Date</Label><Value>{formatDate(form.CreatedAt)}</Value></div>
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
      
      <SectionTitle style={{ marginTop: '1.5rem' }}>📍 Address Information</SectionTitle>
      <FieldGrid>
        {renderField('Permanent Address', 'PermanentAddress', 'textarea', { fullWidth: true })}
        {renderField('Mailing Address', 'MailingAddress', 'textarea', { fullWidth: true })}
        {renderField('City', 'City')}
        {renderField('Country', 'Country')}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '1.5rem' }}>📋 Registration & Property Details</SectionTitle>
      <FieldGrid>
        {renderField('Registration ID', 'RegId')}
        {renderField('Payment Plan ID', 'PlanId')}
        {renderField('Sub Project', 'SubProject')}
        {renderField('Registered Size', 'RegisteredSize')}
        {renderField('Status', 'Status', 'select', { choices: ['Active', 'Blocked', 'Cancelled'] })}
        {renderField('Allotment Status', 'AllotmentStatus', 'select', { choices: ['Allotted', 'Not Allotted', 'Pending'] })}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '1.5rem' }}>👥 Nominee Information</SectionTitle>
      <FieldGrid>
        {renderField('Nominee Name', 'NomineeName')}
        {renderField('Nominee CNIC/ID', 'NomineeId')}
        {renderField('Relationship', 'NomineeRelation')}
      </FieldGrid>
      
      <SectionTitle style={{ marginTop: '1.5rem' }}>📝 Additional Information</SectionTitle>
      <FieldGrid>
        {renderField('Additional Notes', 'AdditionalInfo', 'textarea', { fullWidth: true, rows: 3 })}
      </FieldGrid>
    </>
  );

  const renderAllotmentTab = () => {
    if (mode === 'create') {
      return (
        <EmptyState>
          <h4>Allotment Information</h4>
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
          <h4>Not Allotted</h4>
          <p>This customer has no allotment records.</p>
        </EmptyState>
      );
    }
    
    return (
      <>
        <SectionTitle>Allotment Records</SectionTitle>
        <DataTable>
          <thead>
            <tr>
              <th>Allotment ID</th>
              <th>Property ID</th>
              <th>Allotment Date</th>
              <th>Letter No</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allotments.map((a, i) => (
              <tr key={a.AllotmentId || a.allotmentId || i}>
                <td>{a.AllotmentId || a.allotmentId || '—'}</td>
                <td>{a.PropertyId || a.propertyId || '—'}</td>
                <td>{formatDate(a.AllotmentDate || a.allotmentDate)}</td>
                <td>{a.AllotmentLetterNo || a.allotmentLetterNo || a.allotment_letter_no || '—'}</td>
                <td>
                  <StatusBadge $status={a.Status || a.status}>
                    {a.Status || a.status || 'Unknown'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        
        {allotments[0] && (
          <>
            <SectionTitle style={{ marginTop: '1.5rem' }}>Allotment Details</SectionTitle>
            <InfoCard>
              <FieldGrid>
                <div><Label>Possession Date</Label><Value>{formatDate(allotments[0].PossessionDate || allotments[0].possessionDate)}</Value></div>
                <div><Label>Completion Date</Label><Value>{formatDate(allotments[0].CompletionDate || allotments[0].completionDate)}</Value></div>
                <div><Label>Balloting Date</Label><Value>{formatDate(allotments[0].BallotingDate || allotments[0].ballotingDate)}</Value></div>
                <div><Label>Ballot No</Label><Value>{allotments[0].BallotNo || allotments[0].ballotNo || '—'}</Value></div>
                <FieldGroup className="full-width">
                  <Label>Remarks</Label>
                  <Value>{allotments[0].Remarks || allotments[0].remarks || '—'}</Value>
                </FieldGroup>
              </FieldGrid>
            </InfoCard>
          </>
        )}
      </>
    );
  };

  const renderPaymentsTab = () => {
    if (mode === 'create') {
      return (
        <EmptyState>
          <h4>Payment Details</h4>
          <p>Payment history will be available after the customer is created.</p>
        </EmptyState>
      );
    }
    
    if (paymentsLoading) {
      return <LoadingSpinner>Loading payment details...</LoadingSpinner>;
    }
    
    // Calculate summary
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.Amount || p.amount) || 0), 0);
    const paidCount = payments.filter(p => (p.Status || p.status)?.toLowerCase() === 'paid').length;
    const pendingCount = payments.filter(p => (p.Status || p.status)?.toLowerCase() === 'pending').length;
    
    return (
      <>
        <SectionTitle>Payment Summary</SectionTitle>
        <InfoCard>
          <FieldGrid>
            <div><Label>Total Payments</Label><Value>{payments.length}</Value></div>
            <div><Label>Total Amount Paid</Label><Value>{formatCurrency(totalPaid)}</Value></div>
            <div><Label>Paid Payments</Label><Value>{paidCount}</Value></div>
            <div><Label>Pending Payments</Label><Value>{pendingCount}</Value></div>
          </FieldGrid>
        </InfoCard>
        
        <SectionTitle style={{ marginTop: '1rem' }}>Payment History</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState>
            <p>No payment records found.</p>
          </EmptyState>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference No</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 20).map((p, i) => (
                <tr key={p.PaymentId || p.paymentId || i}>
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
        )}
        {payments.length > 20 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
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
          <h4>History Details</h4>
          <p>Activity history will be available after the customer is created.</p>
        </EmptyState>
      );
    }
    
    return (
      <>
        <SectionTitle>Customer Record Information</SectionTitle>
        <InfoCard>
          <FieldGrid>
            <div><Label>Customer ID</Label><Value>{form.CustomerId || '—'}</Value></div>
            <div><Label>Created At</Label><Value>{formatDate(form.CreatedAt)}</Value></div>
            <div><Label>Current Status</Label><Value><StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge></Value></div>
            <div><Label>Allotment Status</Label><Value><StatusBadge $status={form.AllotmentStatus}>{form.AllotmentStatus || 'Not Set'}</StatusBadge></Value></div>
          </FieldGrid>
        </InfoCard>
        
        <SectionTitle style={{ marginTop: '1rem' }}>Activity Log</SectionTitle>
        <EmptyState>
          <p>Detailed activity logs are not currently available.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Future updates will include edit history, status changes, and user actions.</p>
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
    return `Customer: ${form.FullName || customerId || 'Loading...'}`;
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>
            <Title>{getTitle()}</Title>
            {customerId && <Subtitle>ID: {customerId}</Subtitle>}
          </HeaderTitle>
          <HeaderActions>
            {mode !== 'create' && (
              <IconButton onClick={toggleEditMode} $active={editMode}>
                {editMode ? '✕ Cancel Edit' : '✎ Edit Customer'}
              </IconButton>
            )}
            <CloseButton onClick={onClose}>×</CloseButton>
          </HeaderActions>
        </ModalHeader>
        
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
        
        <TabContent>
          {loading ? (
            <LoadingSpinner>Loading customer data...</LoadingSpinner>
          ) : (
            <>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {renderTabContent()}
            </>
          )}
        </TabContent>
        
        <ModalFooter>
          <div>
            {editMode && mode !== 'create' && customerId && (
              <Button $variant="danger" onClick={handleDelete}>
                🗑 Delete
              </Button>
            )}
          </div>
          <FooterActions>
            <Button onClick={onClose}>Cancel</Button>
            {editMode && (
              <Button $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (mode === 'create' ? 'Create Customer' : 'Save Changes')}
              </Button>
            )}
          </FooterActions>
        </ModalFooter>
      </ModalCard>
    </ModalBackdrop>
  );
}

