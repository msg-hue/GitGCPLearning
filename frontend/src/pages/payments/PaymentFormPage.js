import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { getPayment, getCustomer, createPayment, updatePayment, deletePayment } from '../../utils/api';

/**
 * PaymentFormPage
 * Purpose: Full-page form for Add, Edit, and Display payment data.
 * Based on database.txt schema: paymentid, customerid, paymentdate, amount, method, referenceno, status, remarks
 * Note: ScheduleId removed - payments are linked only via CustomerId
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
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const FormHeader = styled.div`
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
  opacity: 0.9;
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
  color: #059669;
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #d1fae5;
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
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
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
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  background: ${props => props.readOnly ? '#f8fafc' : '#fff'};
  
  &:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
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
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #059669 0%, #047857 100%)';
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
      case 'received': case 'paid': case 'completed': return '#dcfce7';
      case 'pending': return '#fef3c7';
      case 'cancelled': case 'failed': case 'rejected': return '#fef2f2';
      case 'partial': return '#dbeafe';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$status?.toLowerCase()) {
      case 'received': case 'paid': case 'completed': return '#166534';
      case 'pending': return '#92400e';
      case 'cancelled': case 'failed': case 'rejected': return '#dc2626';
      case 'partial': return '#1e40af';
      default: return '#475569';
    }
  }};
`;

const InfoCard = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  color: #047857;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
`;

const CustomerCard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const CustomerInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
`;

const CustomerName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #166534;
`;

const CustomerDetail = styled.div`
  font-size: 0.85rem;
  color: #475569;
`;

const AmountDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
`;

const initialFormState = {
  PaymentId: '',
  CustomerId: '',
  PaymentDate: '',
  Amount: '',
  Method: '',
  ReferenceNo: '',
  Status: 'Pending',
  Remarks: '',
};

export default function PaymentFormPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get customerId from URL params (for creating new payment for specific customer)
  const customerIdFromParams = searchParams.get('customerId');
  
  // Determine mode from URL path
  const isCreateMode = location.pathname.includes('/new');
  const isEditMode = location.pathname.includes('/edit');
  const isViewMode = !isCreateMode && !isEditMode && paymentId;
  
  const [form, setForm] = useState({ ...initialFormState });
  const [originalData, setOriginalData] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(isCreateMode || isEditMode);

  // Load payment data when viewing/editing
  useEffect(() => {
    if (paymentId && !isCreateMode) {
      loadPaymentData();
    } else if (isCreateMode && customerIdFromParams) {
      // Pre-fill customer ID if provided
      setForm(prev => ({ 
        ...prev, 
        CustomerId: customerIdFromParams,
        PaymentDate: new Date().toISOString().slice(0, 10),
        Method: 'Cash',
        Status: 'Pending'
      }));
      loadCustomerData(customerIdFromParams);
    } else if (isCreateMode) {
      // Set default values for new payment
      setForm(prev => ({
        ...prev,
        PaymentDate: new Date().toISOString().slice(0, 10),
        Method: 'Cash',
        Status: 'Pending'
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, isCreateMode, customerIdFromParams]);

  const loadPaymentData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPayment(paymentId);
      const normalized = normalizePaymentData(data);
      setForm(normalized);
      setOriginalData(data);
      
      // Load customer data if available
      if (normalized.CustomerId) {
        await loadCustomerData(normalized.CustomerId);
      }
    } catch (e) {
      setError(e.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async (customerId) => {
    if (!customerId) return;
    setCustomerLoading(true);
    try {
      const data = await getCustomer(customerId);
      setCustomer(data);
    } catch (e) {
      console.error('Failed to load customer:', e);
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  };

  const normalizePaymentData = (data) => ({
    PaymentId: data.PaymentId ?? data.paymentId ?? '',
    CustomerId: data.CustomerId ?? data.customerId ?? '',
    PaymentDate: (data.PaymentDate ?? data.paymentDate ?? '').slice(0, 10),
    Amount: data.Amount ?? data.amount ?? '',
    Method: data.Method ?? data.method ?? '',
    ReferenceNo: data.ReferenceNo ?? data.referenceNo ?? '',
    Status: data.Status ?? data.status ?? 'Pending',
    Remarks: data.Remarks ?? data.remarks ?? '',
    CreatedAt: data.CreatedAt ?? data.createdAt ?? null,
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    
    // If customer ID changes, load customer data
    if (field === 'CustomerId' && value && value !== form.CustomerId) {
      loadCustomerData(value);
    }
  };

  const validateForm = () => {
    if (!form.CustomerId.trim()) {
      setError('Customer ID is required');
      return false;
    }
    if (!form.PaymentDate) {
      setError('Payment Date is required');
      return false;
    }
    if (!form.Amount || isNaN(Number(form.Amount)) || Number(form.Amount) <= 0) {
      setError('Amount must be a positive number');
      return false;
    }
    if (!form.Method) {
      setError('Payment Method is required');
      return false;
    }
    if (!form.Status) {
      setError('Status is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    const payload = {
      CustomerId: form.CustomerId.trim(),
      PaymentDate: form.PaymentDate || null,
      Amount: Number(form.Amount),
      Method: form.Method ? form.Method.trim() : null,
      ReferenceNo: form.ReferenceNo ? form.ReferenceNo.trim() : null,
      Status: form.Status ? form.Status.trim() : 'Pending',
      Remarks: form.Remarks ? form.Remarks.trim() : null,
    };
    
    try {
      if (isCreateMode) {
        const result = await createPayment(payload);
        setSuccess('Payment created successfully!');
        // Navigate to the new payment's view page after a short delay
        setTimeout(() => {
          const newId = result.PaymentId || result.paymentId;
          if (newId) {
            navigate(`/payments/collections/${newId}`, { replace: true });
          } else {
            navigate('/payments/collections', { replace: true });
          }
        }, 1500);
      } else {
        await updatePayment(paymentId, { PaymentId: paymentId, ...payload });
        setSuccess('Payment updated successfully!');
        setEditMode(false);
        // Reload the data
        await loadPaymentData();
      }
    } catch (e) {
      setError(e.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      await deletePayment(paymentId);
      setSuccess('Payment deleted successfully!');
      setTimeout(() => {
        navigate('/payments/collections', { replace: true });
      }, 1500);
    } catch (e) {
      setError(e.message || 'Failed to delete payment');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate('/payments/collections');
    } else if (editMode) {
      // Restore original data
      if (originalData) {
        setForm(normalizePaymentData(originalData));
      }
      setEditMode(false);
      setError('');
    } else {
      navigate('/payments/collections');
    }
  };

  const toggleEditMode = () => {
    if (editMode && !isCreateMode) {
      // Cancel edit
      if (originalData) {
        setForm(normalizePaymentData(originalData));
      }
    }
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '—';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const customerName = useMemo(() => (
    customer?.FullName ?? customer?.fullName ?? customer?.fullname ?? 'Unknown Customer'
  ), [customer]);

  const customerEmail = useMemo(() => (
    customer?.Email ?? customer?.email ?? '—'
  ), [customer]);

  const customerPhone = useMemo(() => (
    customer?.Phone ?? customer?.phone ?? '—'
  ), [customer]);

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
      if (field === 'Amount') {
        return (
          <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
            <Label>{label}</Label>
            <Value style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(value)}</Value>
          </FieldGroup>
        );
      }
      if (field === 'PaymentDate') {
        return (
          <FieldGroup className={options.fullWidth ? 'full-width' : ''}>
            <Label>{label}</Label>
            <Value>{formatDate(value)}</Value>
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
            rows={options.rows || 3}
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
          step={type === 'number' ? '0.01' : undefined}
        />
      </FieldGroup>
    );
  };

  const getTitle = () => {
    if (isCreateMode) return 'Record New Payment';
    if (editMode) return 'Edit Payment';
    return 'Payment Details';
  };

  const getSubtitle = () => {
    if (isCreateMode) return 'Fill in the details below to record a new payment';
    if (paymentId) return `Payment ID: ${paymentId}`;
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
            <IconButton onClick={() => navigate('/payments/collections')}>
              ← Back to List
            </IconButton>
          </HeaderActions>
        </FormHeader>
        
        <FormBody>
          {loading ? (
            <LoadingSpinner>Loading payment data...</LoadingSpinner>
          ) : (
            <>
              {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}
              {success && <SuccessMessage>✓ {success}</SuccessMessage>}
              
              {/* Payment Info Card - Only show when viewing existing payment */}
              {!isCreateMode && originalData && !editMode && (
                <InfoCard>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>Payment ID</InfoLabel>
                      <InfoValue>{form.PaymentId || paymentId}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Amount</InfoLabel>
                      <AmountDisplay>{formatCurrency(form.Amount)}</AmountDisplay>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Status</InfoLabel>
                      <InfoValue>
                        <StatusBadge $status={form.Status}>{form.Status || 'Unknown'}</StatusBadge>
                      </InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Payment Date</InfoLabel>
                      <InfoValue>{formatDate(form.PaymentDate)}</InfoValue>
                    </InfoItem>
                  </InfoGrid>
                </InfoCard>
              )}
              
              {/* Customer Info */}
              {customer && (
                <CustomerCard>
                  <CustomerInfo>
                    <div>
                      <Label style={{ marginBottom: '0.25rem' }}>Customer</Label>
                      <CustomerName>{customerName}</CustomerName>
                    </div>
                    <CustomerDetail>
                      <strong>ID:</strong> {form.CustomerId}
                    </CustomerDetail>
                    <CustomerDetail>
                      <strong>Email:</strong> {customerEmail}
                    </CustomerDetail>
                    <CustomerDetail>
                      <strong>Phone:</strong> {customerPhone}
                    </CustomerDetail>
                  </CustomerInfo>
                </CustomerCard>
              )}
              
              {customerLoading && (
                <CustomerCard>
                  <div style={{ color: '#64748b' }}>Loading customer information...</div>
                </CustomerCard>
              )}
              
              {/* Payment Information */}
              <SectionTitle>💳 Payment Information</SectionTitle>
              <FieldGrid>
                {renderField('Customer ID', 'CustomerId', 'text', { required: true, placeholder: 'e.g., CUST0001' })}
                {renderField('Payment Date', 'PaymentDate', 'date', { required: true })}
                {renderField('Amount', 'Amount', 'number', { required: true, placeholder: 'Enter payment amount' })}
                {renderField('Payment Method', 'Method', 'select', { 
                  required: true,
                  choices: [
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Cheque', label: 'Cheque' },
                    { value: 'Credit Card', label: 'Credit Card' },
                    { value: 'Debit Card', label: 'Debit Card' },
                    { value: 'Online', label: 'Online Payment' },
                    { value: 'Mobile Wallet', label: 'Mobile Wallet' },
                    { value: 'Other', label: 'Other' },
                  ]
                })}
              </FieldGrid>
              
              {/* Status & Reference */}
              <SectionTitle>📋 Status & Reference</SectionTitle>
              <FieldGrid>
                {renderField('Status', 'Status', 'select', { 
                  required: true,
                  choices: [
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Received', label: 'Received' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Partial', label: 'Partial' },
                    { value: 'Cancelled', label: 'Cancelled' },
                    { value: 'Failed', label: 'Failed' },
                    { value: 'Refunded', label: 'Refunded' },
                  ]
                })}
                {renderField('Reference No', 'ReferenceNo', 'text', { placeholder: 'Transaction/Receipt number' })}
              </FieldGrid>
              
              {/* Remarks */}
              <SectionTitle>📝 Remarks</SectionTitle>
              <FieldGrid>
                {renderField('Remarks', 'Remarks', 'textarea', { 
                  fullWidth: true,
                  rows: 4,
                  placeholder: 'Add any additional notes or remarks about this payment...'
                })}
              </FieldGrid>
            </>
          )}
        </FormBody>
        
        <FormFooter>
          <div>
            {!isCreateMode && editMode && (
              <Button $variant="danger" onClick={handleDelete} disabled={saving}>
                🗑 Delete Payment
              </Button>
            )}
          </div>
          <FooterActions>
            <Button onClick={handleCancel} disabled={saving}>
              {isCreateMode ? '← Cancel' : editMode ? '✕ Cancel' : '← Back'}
            </Button>
            {editMode && (
              <Button $variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (isCreateMode ? '+ Record Payment' : '✓ Save Changes')}
              </Button>
            )}
          </FooterActions>
        </FormFooter>
      </FormCard>
    </PageContainer>
  );
}

