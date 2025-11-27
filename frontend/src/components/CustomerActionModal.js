import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.secondary};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.secondary};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: ${props => props.$variant === 'primary' ? props.theme.colors.primary : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : props.theme.colors.secondary};
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? props.theme.colors.primary : props.theme.colors.lightGray};
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CustomerInfo = styled.div`
  padding: 0.75rem;
  background: ${props => props.theme.colors.lightGray};
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
`;

/**
 * CustomerActionModal
 * Purpose: Display action options when a customer row is clicked.
 * Inputs:
 *  - customerId: string customer identifier
 *  - customerName: string customer name (optional)
 *  - onOpenRecord: function to call when "Open Customer Record" is clicked
 *  - onOpenStatement: function to call when "Open Statement" is clicked
 *  - onClose: function to close the modal
 * Outputs:
 *  - Renders a modal with two action buttons
 */
export default function CustomerActionModal({ 
  customerId, 
  customerName, 
  onOpenRecord, 
  onOpenStatement, 
  onClose 
}) {
  const handleOpenRecord = () => {
    if (onOpenRecord) {
      onOpenRecord(customerId);
    }
    onClose();
  };

  const handleOpenStatement = () => {
    if (onOpenStatement) {
      onOpenStatement(customerId);
    }
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Select Action</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        {customerName && (
          <CustomerInfo>
            <strong>Customer:</strong> {customerName} ({customerId})
          </CustomerInfo>
        )}
        
        <ActionButton $variant="primary" onClick={handleOpenRecord}>
          Open Customer Record
        </ActionButton>
        
        <ActionButton onClick={handleOpenStatement}>
          Open Statement
        </ActionButton>
      </ModalContent>
    </ModalOverlay>
  );
}

