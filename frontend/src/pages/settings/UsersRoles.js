import React from 'react';
import UsersGrid from '../../components/UsersGrid';

/**
 * UsersRoles
 * Purpose: Users & Roles management page using the UsersGrid component.
 * This page is accessible via /settings/users-roles route.
 */
export default function UsersRoles() {
  return <UsersGrid title="Users & Roles Management" defaultFilter="All" />;
}
