import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Client, Project } from '../types';
import { mockClients, mockProjects } from '../services/mockData';

const STORAGE_KEY = 'fotograf_crm_v1';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  clients: Client[];
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
}

interface StoredData {
  clients: Client[];
  projects: Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const getInitialData = (): StoredData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredData;
      return {
        clients: parsed.clients || mockClients,
        projects: parsed.projects || mockProjects,
      };
    }
  } catch (error) {
    console.error('Failed to parse CRM storage.', error);
    localStorage.removeItem(STORAGE_KEY);
  }
  return { clients: mockClients, projects: mockProjects };
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    const data = getInitialData();
    setClients(data.clients);
    setProjects(data.projects);
  }, []);

  useEffect(() => {
    const payload: StoredData = { clients, projects };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save CRM storage.', error);
    }
  }, [clients, projects]);

  const currentProject = useMemo(() => {
    if (!currentProjectId) return null;
    return projects.find((project) => project.id === currentProjectId) || null;
  }, [currentProjectId, projects]);

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: `c-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: `p-${Date.now()}-${Math.random()}`,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : project
      )
    );
  };

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectId(project ? project.id : null);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        clients,
        projects,
        addProject,
        updateProject,
        addClient,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
