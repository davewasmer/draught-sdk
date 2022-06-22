import path from 'path';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { dehydrate, QueryClient, QueryFunction } from 'react-query';
import config from './config';

/** Configuration used to specify a hook to be fetched during SSR */
type PrefetchHookConfig = SimplePrefetchConfig | AdvancedPrefetchConfig;

/**
 * The easiest way to prefetch a hook is to just supply the hook in the prefetch
 * array. The hook itself is annotated with metadata at build time, so if you
 * don't need to supply any params or anything fancy, just include the hook directly.
 */
type SimplePrefetchConfig = ((...args: any[]) => any) & { endpoint: string };

/**
 * Allows prefetching queries with params, conditionally based on server-side
 * logic, etc
 */
type AdvancedPrefetchConfig = readonly [
  /** The hook to prefetch */
  hook: SimplePrefetchConfig,
  /**
   * Params to supply. If you supply a function it will be invoked with the SSR
   * context
   */
  input:
    | Record<string, any>
    | ((ctx: GetServerSidePropsContext) => Record<string, any>),
  /** Lets you conditionally prefetch based on server-side logic */
  condition?: (ctx: GetServerSidePropsContext) => boolean
];

/** Prefetch a list of hooks used in a page */
export default function prefetch(
  executeQuery: (
    handlerModule: any,
    req: NextApiRequest,
    res: NextApiResponse
  ) => unknown | Promise<unknown>,
  ...hooks: PrefetchHookConfig[]
): GetServerSideProps {
  return async function getServerSidePropsPrefetcher(ctx) {
    // Here we define a custom server-side query function for react-query to use.
    // This lets us avoid having the SSR process go out to the internet to hit our
    // own API, when it's available in-process. You supply the execution function
    // (probably the same you provided to @draught/gateway).
    let fetcher: QueryFunction = ({ queryKey }) => {
      let url = queryKey[0] as string;
      let params = queryKey[1] as Record<string, string | number>;
      let handlerModule = loadHandlerModule(url);
      let mockReq = {
        url: ctx.req.url,
        method: ctx.req.method,
        headers: ctx.req.headers,
        cookies: ctx.req.cookies,
        query: params,
      };
      let mockRes = {};
      executeQuery(handlerModule, mockReq as any, mockRes as any);
    };

    // Setup a special SSR query client to capture the cache as we go
    let ssrClient = new QueryClient({
      defaultOptions: {
        queries: {
          meta: { prefetching: true },
        },
      },
    });

    // Prefetch each hook in parallel
    await Promise.all(
      hooks.map(hook => prefetchHook(fetcher, hook, ssrClient, ctx))
    );

    // Dehydrate the query client cache into SSR/G props
    return { props: { dehydratedState: dehydrate(ssrClient) } };
  };
}

async function prefetchHook(
  fetcher: QueryFunction,
  hookConfig: PrefetchHookConfig,
  client: QueryClient,
  ctx: GetServerSidePropsContext
) {
  // We need to reconstruct the react-query query key that the SDK
  // will use client side for this exact query, which is the url +
  // params
  let key: [url: string, params: any];

  if (isAdvancedPrefetchConfig(hookConfig)) {
    let [hook, params, condition] = hookConfig;
    // Resolve the params
    params = value(params, ctx);
    // Check if we need to bail
    if (condition && !condition(ctx)) {
      return;
    }
    key = [hook.endpoint, params];
  } else {
    key = [hookConfig.endpoint, null];
  }

  return await client.fetchQuery(key, fetcher);
}

function isAdvancedPrefetchConfig(
  config: PrefetchHookConfig
): config is AdvancedPrefetchConfig {
  return Array.isArray(config);
}

function value<T, U extends any[]>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  valueOrFunction: (T & Exclude<T, Function>) | ((...args: U) => T),
  ...args: U
) {
  if (typeof valueOrFunction !== 'function') {
    return valueOrFunction;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return (valueOrFunction as any)(...args);
}

function loadHandlerModule(url: string) {
  let [, ...endpointPath] = url.split('/');
  let endpointBasepath = endpointPath.join('/') + '.query';
  let endpointFilepath = path.join(config.dir, endpointBasepath);
  let handlerModule = require(endpointFilepath);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return handlerModule;
}
