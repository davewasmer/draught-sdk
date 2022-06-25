const MOCKING_KEY = 'draught-sdk-mocking';
const SCENARIOS_KEY = 'draught-sdk-mock-scenarios';

export default function isMocking() {
  let devmodeEnabled = window.localStorage.getItem(MOCKING_KEY);
  return devmodeEnabled === 'true';
}

export type MockEndpoint<Schema extends Record<string, any>> = (
  ctx: MockContext<Schema>,
  url: string,
  params: unknown
) => void;

export class MockContext<Schema extends Record<string, any>> {
  db = new Proxy({} as { [P in keyof Schema]: MockCollection<Schema[P]> }, {
    get(target, property) {
      if (typeof property !== 'string') {
        throw new Error('Symbol collection names not supported');
      }
      let collectionName = property as keyof Schema & string;
      if (!target[collectionName]) {
        target[collectionName] = new MockCollection(collectionName);
      }
      return target[collectionName];
    },
  });

  scenarios: string[] = [];

  constructor() {
    this.scenarios = (window.localStorage.getItem(SCENARIOS_KEY) ?? '').split(
      ','
    );
  }

  async load(moduleCtx: __WebpackModuleApi.RequireContext) {
    await Promise.all(
      this.scenarios.map(async name => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        let scenario = (moduleCtx(name) as MockScenarioModule).default;
        await scenario(this);
      })
    );
  }

  addScenario(name: string) {
    this.scenarios.push(name);
    this.saveScenarios();
  }

  removeScenario(index: number) {
    this.scenarios.splice(index, 1);
    this.saveScenarios();
  }

  private saveScenarios() {
    if (window.localStorage) {
      window.localStorage.setItem(SCENARIOS_KEY, this.scenarios.join(','));
    }
  }
}

class MockCollection<Document> {
  docs: Document[] = [];

  constructor(public name: string) {}
}

const root = (typeof window === 'undefined' ? {} : window) as {
  mockCtx: MockContext<any>;
};

export const mockCtx = (root.mockCtx = root.mockCtx ?? new MockContext());

export type MockScenarioModule = {
  default(ctx: MockContext<any>): void | Promise<void>;
};
