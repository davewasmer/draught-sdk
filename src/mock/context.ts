import MockCollection from './collection';
import { SCENARIOS_KEY, MockScenarioModule } from './index';

export default class MockContext<Schema extends Record<string, any>> {
  db = new Proxy(
    {} as {
      [P in keyof Schema]: MockCollection<Schema[P]>;
    },
    {
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
    }
  );

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
