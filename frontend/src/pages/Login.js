import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { login } from '../utils/api';

/**
 * Login
 * Purpose: Render a branded login form and authenticate users.
 * Inputs: None (reads user-entered email and password).
 * Outputs: Navigates to dashboard on success; shows error on failure.
 */
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const expiresAt = localStorage.getItem('jwt_expires');
    
    if (token && expiresAt) {
      try {
        const expiryTime = parseInt(expiresAt, 10);
        if (!isNaN(expiryTime) && Date.now() < expiryTime) {
          // Valid token exists, redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // Token expired, clear it
          localStorage.removeItem('jwt');
          localStorage.removeItem('jwt_expires');
          localStorage.removeItem('user');
        }
      } catch (e) {
        // Invalid expiry, clear token
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwt_expires');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);
  /**
   * handleSubmit
   * Purpose: Submit the login form using email (password optional).
   * Inputs: Form event; reads `email` and `password` state.
   * Outputs: Navigates to `/dashboard` on success; shows error on failure.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      console.log('[Login] Login successful:', {
        hasToken: !!result.token,
        hasUser: !!result.user,
        expiresAt: result.expiresAt
      });
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify token is in localStorage before navigating
      const savedToken = localStorage.getItem('jwt');
      if (!savedToken) {
        throw new Error('Token was not saved to localStorage');
      }
      
      console.log('[Login] Token verified in localStorage, navigating to dashboard...');
      // Use replace to prevent going back to login page
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Show detailed error message
      const errorMsg = err.message || 'Login failed';
      console.error('[Login] Error details:', {
        message: err.message,
        error: err,
        stack: err.stack
      });
      // Show user-friendly error message
      if (errorMsg.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (errorMsg.includes('Cannot connect') || errorMsg.includes('CORS') || errorMsg.includes('network')) {
        setError('Cannot connect to server. Please ensure the backend is running on http://localhost:5296');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Wrapper>
      <Card>
        <BrandTitle>Login PMS</BrandTitle>
        <Subtitle>Please sign in to continue</Subtitle>
        {error && <ErrorBox role="alert">{error}</ErrorBox>}
        {loading && <InfoBox>Connecting to server...</InfoBox>}
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={1}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </Form>
      </Card>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
  font-family: 'Lexend', sans-serif;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  padding: 28px;
`;

const BrandTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 24px;
  color: ${(p) => p.theme?.secondary || '#00234C'};
  letter-spacing: 0.2px;
`;

const Subtitle = styled.p`
  margin: 0 0 20px;
  color: #5b6b7c;
`;

const Form = styled.form`
  display: grid;
  grid-gap: 12px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #1f2a37;
`;

const Input = styled.input`
  height: 40px;
  border: 1px solid #d0d7e2;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: ${(p) => p.theme?.primary || '#dd9c6b'};
    box-shadow: 0 0 0 3px rgba(221, 156, 107, 0.2);
  }
`;

const Button = styled.button`
  height: 42px;
  border: none;
  border-radius: 8px;
  background: ${(p) => p.theme?.primary || '#dd9c6b'};
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.04s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-1px); }
  &:disabled { opacity: 0.7; cursor: default; }
`;

const ErrorBox = styled.div`
  background: rgba(255, 0, 0, 0.08);
  border: 1px solid rgba(255, 0, 0, 0.25);
  color: #8b0000;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const InfoBox = styled.div`
  background: rgba(0, 123, 255, 0.08);
  border: 1px solid rgba(0, 123, 255, 0.25);
  color: #004085;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
`;