import dedent from 'dedent';

export default function template(errorTypeImport: string) {
  return dedent`
/**
 *
 * This file is auto-generated via @draught/sdk.
 * DO NOT MODIFY DIRECTLY!
 *
 * Generated: ${new Date().toISOString()}
 *
 */
/* eslint-disable */
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  QueryKey,
  UseMutationOptions } from 'react-query';
import query from '@draught/sdk/lib/src/query';
import mutate from '@draught/sdk/lib/src/mutate';
import addInvalidationHandling, { SdkQueryHook } from '@draught/sdk/lib/src/invalidation';

${errorTypeImport}

export type InputFor<T extends (...args: any[]) => any> = T extends (
  input: infer U,
  ctx: any
) => any
  ? U
  : never;

export type ResponseFor<T extends (...args: any[]) => any> = Exclude<
  Awaited<ReturnType<T>>,
  ErrorPayload
>;

export type QueryOptions<T extends (...args: any[]) => any> = Omit<
  UseQueryOptions<ResponseFor<T>, ErrorPayload, ResponseFor<T>, QueryKey>,
  'queryKey' | 'queryFn'
>;

export type MutationOptions<T extends (...args: any[]) => any> = Omit<
  UseMutationOptions<ResponseFor<T>, ErrorPayload, InputFor<T>, unknown>,
  'mutationFn'
> & { invalidateQueries?: SdkQueryHook[] };


`;
}
