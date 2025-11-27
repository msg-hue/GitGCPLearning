import React from 'react';
import ProjectsGrid from '../../components/ProjectsGrid';

/**
 * Projects
 * Purpose: Property → Projects page that displays a grid of all projects.
 * Inputs: None (reads filters inside ProjectsGrid).
 * Outputs: Renders ProjectsGrid with full CRUD support and pagination.
 */
export default function Projects() {
  return <ProjectsGrid title="Projects" />;
}