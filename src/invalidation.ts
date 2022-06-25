import { noop } from 'lodash';
import { QueryClient, QueryOptions, MutationOptions } from 'react-query';

export type SdkQueryHook = ((
  input: any,
  options: QueryOptions<any>
) => unknown) & { endpoint: string };

export default function addInvalidationHandling(
  options:
    | (MutationOptions<any, any, any, any> & {
        invalidateQueries?: SdkQueryHook[];
      })
    | undefined,
  client: QueryClient
) {
  options ??= {};
  let originalOnSuccess = options.onSuccess ?? noop;
  options.onSuccess = function wrapWithQueryInvalidation(...args: any[]) {
    if (options!.invalidateQueries) {
      options!.invalidateQueries.forEach((hook: SdkQueryHook) => {
        void client.invalidateQueries(hook.endpoint);
      });
    } else {
      void client.invalidateQueries();
    }
    originalOnSuccess.call(this, ...args);
  };
  return options;
}
