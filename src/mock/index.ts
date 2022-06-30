import MockContext from './context';

const MOCKING_KEY = 'draught-sdk-mocking';
export const SCENARIOS_KEY = 'draught-sdk-mock-scenarios';

export function isMocking() {
  let devmodeEnabled = window.localStorage.getItem(MOCKING_KEY);
  return devmodeEnabled === 'true';
}

export type MockEndpoint<
  Schema extends Record<string, any>,
  Params = unknown,
  Result = unknown
> = (ctx: MockContext<Schema>, params: Params, url: string) => Result;

const root = (typeof window === 'undefined' ? {} : window) as {
  mockCtx: MockContext<any>;
};

export const mockCtx = (root.mockCtx = root.mockCtx ?? new MockContext());

export type MockScenarioModule = {
  default(ctx: MockContext<any>): void | Promise<void>;
};
