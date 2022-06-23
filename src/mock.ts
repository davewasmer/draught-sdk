import { MockMutation } from './mutate';
import { MockQuery } from './query';

const MOCKING_KEY = 'draught-sdk-mockin';

export default function isMocking() {
  let devmodeEnabled = window.localStorage.getItem(MOCKING_KEY);
  return devmodeEnabled === 'true';
}

class MockContext<Schema extends Record<string, any>> {
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

  constructor() {
    // load scenarios & replay
  }
}

class MockCollection<Document> {
  docs: Document[] = [];

  constructor(public name: string) {}
}

const root = (typeof window === 'undefined' ? {} : window) as {
  mockCtx: MockContext<any>;
};

const mockCtx = (root.mockCtx = root.mockCtx ?? new MockContext());

export function wrapMock(mock: MockQuery | MockMutation) {
  return (params: any) => {
    mock(mockCtx, params);
  };
}
