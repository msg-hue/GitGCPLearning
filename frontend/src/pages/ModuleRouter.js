import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useLocation } from 'react-router-dom';

// Error boundary for lazy-loaded components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error loading component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Title>Error Loading Component</Title>
          <div style={{ color: '#b00020', marginTop: '1rem' }}>
            {this.state.error?.message || 'Failed to load component. Please refresh the page.'}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#00234c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </Container>
      );
    }
    return this.props.children;
  }
}

const Container = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  color: ${props => props.theme.colors.secondary};
  font-size: 1.25rem;
`;

const Badge = styled.span`
  display: inline-block;
  margin-top: 0.5rem;
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
`;

/**
 * ModuleRouter
 * Purpose: Route dynamic module/view paths to their specific components. If a
 *          component is not yet implemented, show a branded fallback.
 * Inputs: Reads `module` and `view` from URL params.
 * Outputs: Renders the mapped component or a simple placeholder.
 */
export default function ModuleRouter() {
  const { module, view } = useParams();
  const location = useLocation();
  
  // Force re-render when location changes by using location.pathname as dependency
  // This ensures components update when navigating between routes
  useEffect(() => {
    // Scroll to top on route change for better UX
    window.scrollTo(0, 0);
  }, [location.pathname, module, view]);

  // Map of module/view to components. Extend as new pages are added.
  const routes = {
    customers: {
      'summary': React.lazy(() => import('./customers/CustomersSummary')),
      'all-customers': React.lazy(() => import('./customers/AllCustomers')),
      'active-customers': React.lazy(() => import('./customers/ActiveCustomers')),
      'blocked-customers': React.lazy(() => import('./customers/BlockedCustomers')),
    },
    allotment: {
      '': React.lazy(() => import('./Allotment')),
    },
    property: {
      projects: React.lazy(() => import('./property/Projects')),
      'inventory-status': React.lazy(() => import('./property/InventoryStatus')),
      'price-management': React.lazy(() => import('./property/PriceManagement')),
      'availability-matrix': React.lazy(() => import('./property/AvailabilityMatrix')),
      'all-properties': React.lazy(() => import('./property/AllProperties')),
    },
    payments: {
      collections: React.lazy(() => import('./payments/Collections')),
      'dues-defaulters': React.lazy(() => import('./payments/DuesDefaulters')),
      'waivers-adjustments': React.lazy(() => import('./payments/WaiversAdjustments')),
      'ndc-management': React.lazy(() => import('./payments/NdcManagement')),
      refunds: React.lazy(() => import('./payments/Refunds')),
      'financial-ledger': React.lazy(() => import('./payments/FinancialLedger')),
    },
    schedule: {
      bookings: React.lazy(() => import('./schedule/Bookings')),
      'holds-management': React.lazy(() => import('./schedule/HoldsManagement')),
      possession: React.lazy(() => import('./schedule/Possession')),
      'booking-approvals': React.lazy(() => import('./schedule/BookingApprovals')),
      'payment-plans': React.lazy(() => import('./schedule/PaymentPlans')),
      'payment-schedules': React.lazy(() => import('./schedule/PaymentSchedules')),
      'payment-schedule-editor': React.lazy(() => import('./schedule/PaymentScheduleEditor')),
    },
    transfer: {
      'transfer-requests': React.lazy(() => import('./transfer/TransferRequests')),
      'transfer-approvals': React.lazy(() => import('./transfer/TransferApprovals')),
    },
    reports: {
      'sales-analytics': React.lazy(() => import('./reports/SalesAnalytics')),
      'collections-analytics': React.lazy(() => import('./reports/CollectionsAnalytics')),
      'dues-analysis': React.lazy(() => import('./reports/DuesAnalysis')),
      'possession-status': React.lazy(() => import('./reports/PossessionStatus')),
      'transfer-summary': React.lazy(() => import('./reports/TransferSummary')),
      'custom-reports': React.lazy(() => import('./reports/CustomReports')),
    },
    'ai-automation': {
      'lead-scoring': React.lazy(() => import('./ai-automation/LeadScoring')),
      'collection-prediction': React.lazy(() => import('./ai-automation/CollectionPrediction')),
      'anomaly-detection': React.lazy(() => import('./ai-automation/AnomalyDetection')),
      'automated-reminders': React.lazy(() => import('./ai-automation/AutomatedReminders')),
      'smart-recommendations': React.lazy(() => import('./ai-automation/SmartRecommendations')),
      'audit-trail-ai-actions': React.lazy(() => import('./ai-automation/AuditTrailAIActions')),
    },
    settings: {
      'company-settings': React.lazy(() => import('./settings/CompanySettings')),
      'business-rules': React.lazy(() => import('./settings/BusinessRules')),
      'payment-configuration': React.lazy(() => import('./settings/PaymentConfiguration')),
      'notification-rules': React.lazy(() => import('./settings/NotificationRules')),
      'users-roles': React.lazy(() => import('./settings/UsersRoles')),
      'approval-workflows': React.lazy(() => import('./settings/ApprovalWorkflows')),
      'system-configuration': React.lazy(() => import('./settings/SystemConfiguration')),
      'compliance-configuration': React.lazy(() => import('./settings/ComplianceConfiguration')),
    },
    compliance: {
      'audit-trail': React.lazy(() => import('./compliance/AuditTrail')),
      'approval-queue': React.lazy(() => import('./compliance/ApprovalQueue')),
      'compliance-events': React.lazy(() => import('./compliance/ComplianceEvents')),
      'data-management': React.lazy(() => import('./compliance/DataManagement')),
      'risk-assessment': React.lazy(() => import('./compliance/RiskAssessment')),
      'policy-monitoring': React.lazy(() => import('./compliance/PolicyMonitoring')),
      'compliance-reports': React.lazy(() => import('./compliance/ComplianceReports')),
    },
  };

  // Handle both undefined view and empty string view
  const viewKey = view || '';
  const Mod = routes[module]?.[viewKey];
  // Use location.pathname as key to force remount on route change
  const routeKey = `${module}-${viewKey}-${location.pathname}`;
  
  if (Mod) {
    return (
      <React.Suspense 
        key={routeKey}
        fallback={<Container><Title>Loading…</Title></Container>}
      >
        <ErrorBoundary>
          <Mod key={routeKey} />
        </ErrorBoundary>
      </React.Suspense>
    );
  }

  const title = (module || 'Module').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const detail = (view || 'Overview').replace(/-/g, ' ');
  return (
    <Container>
      <Title>{title}</Title>
      <div>This section is a placeholder for "{title}".</div>
      <Badge>{detail}</Badge>
    </Container>
  );
}