import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('./contexts/DataContext', () => {
  const noop = vi.fn();
  return {
    useData: () => ({
      congregationProfile: { name: 'Congrégation Test' },
      upcomingVisits: [],
      pastUnarchivedVisits: [],
      deleteVisit: noop,
      completeVisit: noop,
      importData: noop,
      resetData: noop,
      speakers: [],
      archivedVisits: [],
      hosts: [],
      visits: [],
      logoUrl: 'test-logo.svg',
    }),
  };
});

vi.mock('./contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('./contexts/ConfirmContext', () => ({
  useConfirm: () => vi.fn(async () => true),
}));

vi.mock('./hooks/useVisitNotifications', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
  },
}));

function createNoopComponent(name: string) {
  const Stub: React.FC = () => <div data-testid={`${name}-stub`} />;
  Stub.displayName = `${name}-stub-component`;
  return Stub;
}

vi.mock('./components/UpcomingVisits', () => ({
  UpcomingVisits: createNoopComponent('upcoming-visits'),
}));

vi.mock('./components/SpeakerList', () => ({
  SpeakerList: createNoopComponent('speaker-list'),
}));

vi.mock('./components/ScheduleVisitModal', () => ({
  ScheduleVisitModal: createNoopComponent('schedule-visit-modal'),
}));

vi.mock('./components/CalendarView', () => ({
  CalendarView: createNoopComponent('calendar-view'),
}));

vi.mock('./components/MessagingCenter', () => ({
  MessagingCenter: createNoopComponent('messaging-center'),
}));

vi.mock('./components/SpeakerDetailsModal', () => ({
  SpeakerDetailsModal: createNoopComponent('speaker-details-modal'),
}));

vi.mock('./components/Settings', () => ({
  Settings: (props: any) => (
    <div data-testid="settings-stub">
      <button onClick={props.onImport}>Importer</button>
    </div>
  ),
}));

vi.mock('./components/Icons', () => ({
  CalendarIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ListViewIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  EnvelopeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  CogIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  MoonIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  SunIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  SearchIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  DashboardIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  BookOpenIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  PodiumIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ChartBarIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  CalendarDaysIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  PlusIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  UserIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  HomeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  PrintIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

vi.mock('./components/MessageGeneratorModal', () => ({
  MessageGeneratorModal: createNoopComponent('message-generator-modal'),
}));

vi.mock('./components/NotificationPermissionBanner', () => ({
  NotificationPermissionBanner: (props: any) => (
    <div data-testid="notification-banner">
      <button onClick={props.onEnable}>Activer</button>
    </div>
  ),
}));

vi.mock('./components/GlobalSearchModal', () => ({
  GlobalSearchModal: createNoopComponent('global-search-modal'),
}));

vi.mock('./components/HostDetailsModal', () => ({
  HostDetailsModal: createNoopComponent('host-details-modal'),
}));

vi.mock('./components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-stub">Dashboard</div>,
}));

vi.mock('./components/HostList', () => ({
  HostList: createNoopComponent('host-list'),
}));

vi.mock('./components/PastVisitsManager', () => ({
  PastVisitsManager: createNoopComponent('past-visits-manager'),
}));

vi.mock('./components/FAB', () => ({
  FAB: () => <div data-testid="fab-stub" />,
}));

vi.mock('./components/TalksManager', () => ({
  TalksManager: createNoopComponent('talks-manager'),
}));

vi.mock('./components/TimelineView', () => ({
  TimelineView: createNoopComponent('timeline-view'),
}));

vi.mock('./components/FeedbackModal', () => ({
  FeedbackModal: createNoopComponent('feedback-modal'),
}));

vi.mock('./components/WeekView', () => ({
  WeekView: createNoopComponent('week-view'),
}));

vi.mock('./components/HostRequestModal', () => ({
  HostRequestModal: createNoopComponent('host-request-modal'),
}));

vi.mock('./components/Statistics', () => ({
  Statistics: createNoopComponent('statistics'),
}));

vi.mock('./components/PrintPreviewModal', () => ({
  PrintPreviewModal: (props: any) => <div data-testid="print-preview">{props.children}</div>,
}));

vi.mock('./components/DashboardPrintLayout', () => ({
  DashboardPrintLayout: createNoopComponent('dashboard-print-layout'),
}));

import App from './App';

describe('App', () => {
  it('affiche la navigation principale', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Planning')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Messagerie|Messages/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Paramètres|Settings/)[0]).toBeInTheDocument();
    });
  });
});
