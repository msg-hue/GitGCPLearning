import React, { useState } from 'react';
import styled from 'styled-components';
import { searchCustomerForAllotment, getAvailableProperties, createAllotment } from '../utils/api';
import { FiSearch, FiCheckCircle, FiXCircle, FiAlertCircle, FiHome } from 'react-icons/fi';

const Wrap = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.8rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0.5rem 0 0;
  color: ${p => p.theme.colors.gray};
  font-size: 0.95rem;
`;

const Section = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.2rem;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${p => p.theme.colors.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: 'Lexend', sans-serif;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Lexend', sans-serif;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.secondary};
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SearchButton = styled(Button)`
  margin-left: 0.5rem;
`;

const CustomerInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const CustomerInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CustomerInfoLabel = styled.span`
  color: ${p => p.theme.colors.gray};
  font-size: 0.9rem;
`;

const CustomerInfoValue = styled.span`
  color: ${p => p.theme.colors.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  ${p => p.$success && `
    background: #d4edda;
    color: #155724;
  `}
  ${p => p.$error && `
    background: #f8d7da;
    color: #721c24;
  `}
`;

const Alert = styled.div`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  ${p => p.$type === 'error' && `
    background: #f8d7da;
    color: #721c24;
  `}
  ${p => p.$type === 'success' && `
    background: #d4edda;
    color: #155724;
  `}
  ${p => p.$type === 'info' && `
    background: #d1ecf1;
    color: #0c5460;
  `}
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PropertyCard = styled.div`
  border: 2px solid ${p => p.$selected ? p.theme.colors.primary : '#ddd'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${p => p.$selected ? '#fff5f0' : '#fff'};

  &:hover {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const PropertyCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const PropertyId = styled.div`
  font-weight: 600;
  color: ${p => p.theme.colors.secondary};
  font-size: 1rem;
`;

const PropertyName = styled.div`
  color: ${p => p.theme.colors.gray};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const PropertyDetail = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
`;

const PropertyDetailLabel = styled.span`
  color: ${p => p.theme.colors.gray};
`;

const PropertyDetailValue = styled.span`
  color: ${p => p.theme.colors.secondary};
  font-weight: 500;
`;

const LoadingText = styled.div`
  text-align: center;
  color: ${p => p.theme.colors.gray};
  padding: 2rem;
`;

const EmptyText = styled.div`
  text-align: center;
  color: ${p => p.theme.colors.gray};
  padding: 2rem;
`;

/**
 * Allotment
 * Purpose: Create new allotment by searching customer and selecting property
 * Inputs: None
 * Outputs: Form to search customer, select property, and create allotment
 */
export default function Allotment() {
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [isUnAllotted, setIsUnAllotted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleSearchCustomer = async () => {
    if (!customerId.trim()) {
      setAlert({ type: 'error', message: 'Please enter a Customer ID' });
      return;
    }

    setSearching(true);
    setAlert(null);
    setCustomer(null);
    setIsUnAllotted(false);
    setProperties([]);
    setSelectedProperty(null);

    try {
      const result = await searchCustomerForAllotment(customerId.trim());
      setCustomer(result.customer);
      setIsUnAllotted(result.isUnAllotted);

      if (result.isUnAllotted) {
        // Load available properties
        setLoadingProperties(true);
        const propsData = await getAvailableProperties();
        setProperties(propsData.data || []);
        setLoadingProperties(false);
      } else {
        setAlert({
          type: 'error',
          message: result.message || 'Customer already has an active allotment'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error searching customer'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleCreateAllotment = async () => {
    if (!customer || !selectedProperty) {
      setAlert({ type: 'error', message: 'Please select a property' });
      return;
    }

    setCreating(true);
    setAlert(null);

    try {
      const payload = {
        customerId: customer.customerId || customer.CustomerId,
        propertyId: selectedProperty.propertyId || selectedProperty.PropertyId,
        allotmentDate: new Date().toISOString(),
      };

      await createAllotment(payload);
      
      setAlert({
        type: 'success',
        message: `Allotment created successfully! Customer ${customer.customerId || customer.CustomerId} is now allotted to property ${selectedProperty.propertyId || selectedProperty.PropertyId}`
      });

      // Reset form
      setCustomerId('');
      setCustomer(null);
      setIsUnAllotted(false);
      setProperties([]);
      setSelectedProperty(null);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error creating allotment'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Wrap>
      <Header>
        <Title>New Allotment</Title>
        <Subtitle>Search for a customer and assign an available property</Subtitle>
      </Header>

      {alert && (
        <Alert $type={alert.type}>
          {alert.type === 'error' && <FiXCircle />}
          {alert.type === 'success' && <FiCheckCircle />}
          {alert.type === 'info' && <FiAlertCircle />}
          {alert.message}
        </Alert>
      )}

      <Section>
        <SectionTitle>Step 1: Search Customer</SectionTitle>
        <FormGroup>
          <Label>Customer ID</Label>
          <div style={{ display: 'flex' }}>
            <Input
              type="text"
              placeholder="Enter Customer ID (e.g., C0001234)"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
              disabled={searching}
            />
            <SearchButton
              onClick={handleSearchCustomer}
              disabled={searching || !customerId.trim()}
            >
              {searching ? 'Searching...' : <><FiSearch /> Search</>}
            </SearchButton>
          </div>
        </FormGroup>

        {customer && (
          <CustomerInfo>
            <CustomerInfoRow>
              <CustomerInfoLabel>Customer ID:</CustomerInfoLabel>
              <CustomerInfoValue>{customer.customerId || customer.CustomerId}</CustomerInfoValue>
            </CustomerInfoRow>
            <CustomerInfoRow>
              <CustomerInfoLabel>Full Name:</CustomerInfoLabel>
              <CustomerInfoValue>{customer.fullName || customer.FullName || 'N/A'}</CustomerInfoValue>
            </CustomerInfoRow>
            <CustomerInfoRow>
              <CustomerInfoLabel>Phone:</CustomerInfoLabel>
              <CustomerInfoValue>{customer.phone || customer.Phone || 'N/A'}</CustomerInfoValue>
            </CustomerInfoRow>
            <CustomerInfoRow>
              <CustomerInfoLabel>Email:</CustomerInfoLabel>
              <CustomerInfoValue>{customer.email || customer.Email || 'N/A'}</CustomerInfoValue>
            </CustomerInfoRow>
            <CustomerInfoRow>
              <CustomerInfoLabel>CNIC:</CustomerInfoLabel>
              <CustomerInfoValue>{customer.cnic || customer.Cnic || 'N/A'}</CustomerInfoValue>
            </CustomerInfoRow>
            <CustomerInfoRow>
              <CustomerInfoLabel>Status:</CustomerInfoLabel>
              <StatusBadge $success={isUnAllotted} $error={!isUnAllotted}>
                {isUnAllotted ? (
                  <>
                    <FiCheckCircle /> Available for Allotment
                  </>
                ) : (
                  <>
                    <FiXCircle /> Already Allotted
                  </>
                )}
              </StatusBadge>
            </CustomerInfoRow>
          </CustomerInfo>
        )}
      </Section>

      {isUnAllotted && customer && (
        <Section>
          <SectionTitle>Step 2: Select Property</SectionTitle>
          {loadingProperties ? (
            <LoadingText>Loading available properties...</LoadingText>
          ) : properties.length === 0 ? (
            <EmptyText>No available properties found</EmptyText>
          ) : (
            <>
              <PropertyGrid>
                {properties.map((property) => (
                  <PropertyCard
                    key={property.propertyId || property.PropertyId}
                    $selected={(selectedProperty?.propertyId || selectedProperty?.PropertyId) === (property.propertyId || property.PropertyId)}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <PropertyCardHeader>
                      <PropertyId>{property.propertyId || property.PropertyId}</PropertyId>
                      <FiHome size={20} color={(selectedProperty?.propertyId || selectedProperty?.PropertyId) === (property.propertyId || property.PropertyId) ? '#dd9c6b' : '#888'} />
                    </PropertyCardHeader>
                    <PropertyName>{property.propertyName || property.PropertyName || property.plotNo || property.PlotNo || property.propertyId || property.PropertyId || 'N/A'}</PropertyName>
                    {(property.projectName || property.ProjectName) && (
                      <PropertyDetail>
                        <PropertyDetailLabel>Project:</PropertyDetailLabel>
                        <PropertyDetailValue>{property.projectName || property.ProjectName}</PropertyDetailValue>
                      </PropertyDetail>
                    )}
                    {(property.size || property.Size) && (
                      <PropertyDetail>
                        <PropertyDetailLabel>Size:</PropertyDetailLabel>
                        <PropertyDetailValue>{property.size || property.Size}</PropertyDetailValue>
                      </PropertyDetail>
                    )}
                    {(property.price || property.Price) && (
                      <PropertyDetail>
                        <PropertyDetailLabel>Price:</PropertyDetailLabel>
                        <PropertyDetailValue>₹{(property.price || property.Price).toLocaleString()}</PropertyDetailValue>
                      </PropertyDetail>
                    )}
                    {(property.location || property.Location) && (
                      <PropertyDetail>
                        <PropertyDetailLabel>Location:</PropertyDetailLabel>
                        <PropertyDetailValue>{property.location || property.Location}</PropertyDetailValue>
                      </PropertyDetail>
                    )}
                  </PropertyCard>
                ))}
              </PropertyGrid>

              {selectedProperty && (
                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <Button
                    onClick={handleCreateAllotment}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : <><FiCheckCircle /> Create Allotment</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </Section>
      )}
    </Wrap>
  );
}

