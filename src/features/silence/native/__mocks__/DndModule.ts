import type {
  DndEnterResult,
  DndExitResult,
  DndNativeModule,
  DndStatus,
} from '../DndModule';

let mockGranted = false;
let mockCurrentFilter = 1; // INTERRUPTION_FILTER_ALL
let mockOwnedByApp = false;
let mockEndsAt = 0;
let mockPreviousFilter = 1;

export const __setMockDndState = (state: {
  granted?: boolean;
  currentFilter?: number;
  ownedByApp?: boolean;
  endsAt?: number;
  previousFilter?: number;
}) => {
  if (state.granted !== undefined) mockGranted = state.granted;
  if (state.currentFilter !== undefined) mockCurrentFilter = state.currentFilter;
  if (state.ownedByApp !== undefined) mockOwnedByApp = state.ownedByApp;
  if (state.endsAt !== undefined) mockEndsAt = state.endsAt;
  if (state.previousFilter !== undefined) mockPreviousFilter = state.previousFilter;
};

export const __resetMockDndState = () => {
  mockGranted = false;
  mockCurrentFilter = 1;
  mockOwnedByApp = false;
  mockEndsAt = 0;
  mockPreviousFilter = 1;
};

export const dnd: DndNativeModule = {
  isPolicyAccessGranted: jest.fn(async (): Promise<boolean> => mockGranted),
  openPolicyAccessSettings: jest.fn(async (): Promise<void> => {}),
  getStatus: jest.fn(async (): Promise<DndStatus> => ({
    granted: mockGranted,
    currentFilter: mockCurrentFilter,
    ownedByApp: mockOwnedByApp,
    endsAt: mockEndsAt,
  })),
  enter: jest.fn(async (endsAtMs: number): Promise<DndEnterResult> => {
    if (!mockGranted) {
      return 'not_granted';
    }
    if (mockOwnedByApp) {
      mockEndsAt = endsAtMs;
      return 'applied';
    }
    // PRIORITY (2), NONE (3), ALARMS (4)
    if (mockCurrentFilter >= 2 && mockCurrentFilter <= 4) {
      return 'already_quiet';
    }
    mockPreviousFilter = mockCurrentFilter === 0 ? 1 : mockCurrentFilter;
    mockCurrentFilter = 2; // PRIORITY
    mockOwnedByApp = true;
    mockEndsAt = endsAtMs;
    return 'applied';
  }),
  exit: jest.fn(async (): Promise<DndExitResult> => {
    if (!mockOwnedByApp) {
      return 'nothing_to_restore';
    }
    if (!mockGranted) {
      mockOwnedByApp = false;
      mockEndsAt = 0;
      return 'restored';
    }
    if (mockCurrentFilter === 2) {
      mockCurrentFilter = mockPreviousFilter;
    }
    mockOwnedByApp = false;
    mockEndsAt = 0;
    return 'restored';
  }),
};
