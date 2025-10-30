import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Visit, Speaker, Host, MessageRole, MessageType } from '../types';

interface MessageModalData {
  visit?: Visit;
  speaker?: Speaker;
  host?: Host;
  role: MessageRole;
  messageType?: MessageType;
  initialText?: string;
}

interface ModalState {
  schedule: { isOpen: boolean; visit: Visit | null; speaker: Speaker | null };
  speakerDetails: { isOpen: boolean; speaker: Speaker | null };
  messageGenerator: { isOpen: boolean; data: MessageModalData | null };
  search: { isOpen: boolean };
  hostDetails: { isOpen: boolean; host: Host | null };
  hostRequest: { isOpen: boolean; visits: Visit[] };
  feedback: { isOpen: boolean; visit: Visit | null };
  print: { isOpen: boolean };
}

type ModalAction =
  | { type: 'OPEN_SCHEDULE'; visit?: Visit; speaker?: Speaker }
  | { type: 'CLOSE_SCHEDULE' }
  | { type: 'OPEN_SPEAKER_DETAILS'; speaker: Speaker | null }
  | { type: 'CLOSE_SPEAKER_DETAILS' }
  | { type: 'OPEN_MESSAGE_GENERATOR'; data: MessageModalData }
  | { type: 'CLOSE_MESSAGE_GENERATOR' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'CLOSE_SEARCH' }
  | { type: 'OPEN_HOST_DETAILS'; host: Host | null }
  | { type: 'CLOSE_HOST_DETAILS' }
  | { type: 'OPEN_HOST_REQUEST'; visits: Visit[] }
  | { type: 'CLOSE_HOST_REQUEST' }
  | { type: 'OPEN_FEEDBACK'; visit: Visit }
  | { type: 'CLOSE_FEEDBACK' }
  | { type: 'OPEN_PRINT' }
  | { type: 'CLOSE_PRINT' };

const initialState: ModalState = {
  schedule: { isOpen: false, visit: null, speaker: null },
  speakerDetails: { isOpen: false, speaker: null },
  messageGenerator: { isOpen: false, data: null },
  search: { isOpen: false },
  hostDetails: { isOpen: false, host: null },
  hostRequest: { isOpen: false, visits: [] },
  feedback: { isOpen: false, visit: null },
  print: { isOpen: false },
};

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_SCHEDULE':
      return { ...state, schedule: { isOpen: true, visit: action.visit || null, speaker: action.speaker || null } };
    case 'CLOSE_SCHEDULE':
      return { ...state, schedule: { isOpen: false, visit: null, speaker: null } };
    case 'OPEN_SPEAKER_DETAILS':
      return { ...state, speakerDetails: { isOpen: true, speaker: action.speaker } };
    case 'CLOSE_SPEAKER_DETAILS':
      return { ...state, speakerDetails: { isOpen: false, speaker: null } };
    case 'OPEN_MESSAGE_GENERATOR':
      return { ...state, messageGenerator: { isOpen: true, data: action.data } };
    case 'CLOSE_MESSAGE_GENERATOR':
      return { ...state, messageGenerator: { isOpen: false, data: null } };
    case 'OPEN_SEARCH':
      return { ...state, search: { isOpen: true } };
    case 'CLOSE_SEARCH':
      return { ...state, search: { isOpen: false } };
    case 'OPEN_HOST_DETAILS':
      return { ...state, hostDetails: { isOpen: true, host: action.host } };
    case 'CLOSE_HOST_DETAILS':
      return { ...state, hostDetails: { isOpen: false, host: null } };
    case 'OPEN_HOST_REQUEST':
      return { ...state, hostRequest: { isOpen: true, visits: action.visits } };
    case 'CLOSE_HOST_REQUEST':
      return { ...state, hostRequest: { isOpen: false, visits: [] } };
    case 'OPEN_FEEDBACK':
      return { ...state, feedback: { isOpen: true, visit: action.visit } };
    case 'CLOSE_FEEDBACK':
      return { ...state, feedback: { isOpen: false, visit: null } };
    case 'OPEN_PRINT':
      return { ...state, print: { isOpen: true } };
    case 'CLOSE_PRINT':
      return { ...state, print: { isOpen: false } };
    default:
      return state;
  }
};

interface ModalContextType {
  state: ModalState;
  dispatch: React.Dispatch<ModalAction>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);
  return <ModalContext.Provider value={{ state, dispatch }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
