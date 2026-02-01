import type { Client, Project } from '../types';

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Jan Novak',
    email: 'novak@email.cz',
    phone: '+420 777 123 456',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Firma ABC s.r.o.',
    email: 'marketing@abc.cz',
    notes: 'Preferuji produktove fotky na bilem pozadi',
    createdAt: '2026-01-05T14:30:00Z',
  },
  {
    id: 'c3',
    name: 'Marie Svobodova',
    email: 'marie.s@gmail.com',
    phone: '+420 608 555 333',
    createdAt: '2025-12-20T09:15:00Z',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Svatba Novakovi',
    clientId: 'c1',
    type: 'event',
    status: 'delivered',
    date: '2026-01-15',
    files: [],
    gallery: {
      published: true,
      link: 'https://foto.app/g/abc123',
      selectedFileIds: [],
      allowDownload: true,
    },
    activity: [
      { id: 'a1', type: 'created', timestamp: '2026-01-10T10:00:00Z', description: 'Projekt vytvoren' },
      { id: 'a2', type: 'uploaded', timestamp: '2026-01-16T14:00:00Z', description: 'Nahrano 342 fotek' },
      { id: 'a3', type: 'edited', timestamp: '2026-01-16T15:30:00Z', description: 'AI zpracovani dokonceno' },
      { id: 'a4', type: 'published', timestamp: '2026-01-17T10:00:00Z', description: 'Galerie publikovana' },
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-17T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Produktove foto Q1',
    clientId: 'c2',
    type: 'product',
    status: 'editing',
    date: '2026-01-20',
    files: [],
    gallery: { published: false, selectedFileIds: [], allowDownload: false },
    activity: [
      { id: 'a5', type: 'created', timestamp: '2026-01-18T09:00:00Z', description: 'Projekt vytvoren' },
      { id: 'a6', type: 'uploaded', timestamp: '2026-01-20T11:00:00Z', description: 'Nahrano 48 fotek' },
    ],
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z',
  },
  {
    id: 'p3',
    name: 'Rodinne foceni',
    clientId: 'c3',
    type: 'portrait',
    status: 'draft',
    date: '2026-01-28',
    files: [],
    gallery: { published: false, selectedFileIds: [], allowDownload: true },
    activity: [
      { id: 'a7', type: 'created', timestamp: '2026-01-22T16:00:00Z', description: 'Projekt vytvoren' },
    ],
    createdAt: '2026-01-22T16:00:00Z',
    updatedAt: '2026-01-22T16:00:00Z',
  },
];

export function getClientById(id: string): Client | undefined {
  return mockClients.find((client) => client.id === id);
}

export function getProjectsByClientId(clientId: string): Project[] {
  return mockProjects.filter((project) => project.clientId === clientId);
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((project) => project.id === id);
}
