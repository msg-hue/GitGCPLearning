import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiUsers, FiCheckCircle, FiSlash, FiTrendingUp } from 'react-icons/fi';
import { getCustomers } from '../../utils/api';

const Wrap = styled.div`
  padding: 1.5rem;
  font-family: 'Lexend', sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.6rem;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 10px;
  border-top: 4px solid ${p => p.color || p.theme.colors.primary};
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const IconWrap = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: ${p => p.bgColor || p.theme.colors.lightGray};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.color || p.theme.colors.secondary};
  flex-shrink: 0;
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Label = styled.span`
  color: ${p => p.theme.colors.gray};
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  color: ${p => p.theme.colors.secondary};
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
`;

const LinkCard = styled(Link)`
  text-decoration: none;
  display: block;
`;

const Section = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: ${p => p.theme.colors.secondary};
  font-size: 1.2rem;
  font-weight: 600;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${p => p.theme.colors.gray};
  font-size: 1rem;
`;

const ErrorText = styled.div`
  text-align: center;
  padding: 2rem;
  color: #d9534f;
  font-size: 1rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
`;

/**
 * CustomersSummary
 * Purpose: Display summary statistics for all customers, active customers, and blocked customers.
 * Inputs: None.
 * Outputs: Summary cards with counts and links to detailed views.
 */
export default function CustomersSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    // Fetch customer statistics
    Promise.all([
      getCustomers({ page: 1, pageSize: 1 }), // Get total count
      getCustomers({ status: 'Active', page: 1, pageSize: 1 }), // Get active count
      getCustomers({ status: 'Blocked', page: 1, pageSize: 1 }), // Get blocked count
    ])
      .then(([allData, activeData, blockedData]) => {
        if (!isMounted) return;

        // Extract totalCount from API response (handles both paginated and array responses)
        const getCount = (data) => {
          if (typeof data?.totalCount === 'number') {
            return data.totalCount;
          }
          if (Array.isArray(data?.data)) {
            return data.data.length;
          }
          if (Array.isArray(data)) {
            return data.length;
          }
          return 0;
        };

        const total = getCount(allData);
        const active = getCount(activeData);
        const blocked = getCount(blockedData);

        console.log('[CustomersSummary] Statistics loaded:', { total, active, blocked });

        setStats({
          total,
          active,
          blocked,
        });
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('[CustomersSummary] Error loading statistics:', err);
        setError(err.message || 'Failed to load customer statistics');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <Wrap>
        <Header>
          <Title>Customers Summary</Title>
        </Header>
        <LoadingText>Loading customer statistics...</LoadingText>
      </Wrap>
    );
  }

  if (error) {
    return (
      <Wrap>
        <Header>
          <Title>Customers Summary</Title>
        </Header>
        <ErrorText>Error: {error}</ErrorText>
      </Wrap>
    );
  }

  const summaryCards = [
    {
      label: 'Total Customers',
      value: stats.total,
      icon: FiUsers,
      color: '#00234C',
      bgColor: '#E8F0F5',
      link: '/customers/all-customers',
    },
    {
      label: 'Active Customers',
      value: stats.active,
      icon: FiCheckCircle,
      color: '#28a745',
      bgColor: '#E8F5E9',
      link: '/customers/active-customers',
    },
    {
      label: 'Blocked Customers',
      value: stats.blocked,
      icon: FiSlash,
      color: '#dc3545',
      bgColor: '#F5E8E8',
      link: '/customers/blocked-customers',
    },
  ];

  return (
    <Wrap>
      <Header>
        <Title>Customers Summary</Title>
      </Header>

      <Section>
        <SectionTitle>Customer Statistics</SectionTitle>
        <Grid>
          {summaryCards.map((card, index) => (
            <LinkCard key={index} to={card.link}>
              <Card color={card.color}>
                <IconWrap bgColor={card.bgColor} color={card.color}>
                  <card.icon size={24} />
                </IconWrap>
                <Metric>
                  <Label>{card.label}</Label>
                  <Value>{card.value.toLocaleString()}</Value>
                </Metric>
              </Card>
            </LinkCard>
          ))}
        </Grid>
      </Section>
    </Wrap>
  );
}

