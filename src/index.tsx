import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from 'react';
import { QueryFunction } from 'react-query';

type SdkContext = {
  query(): void;
  mutate(): void;
};

const context = createContext<SdkContext | null>(null);

export default function useSdk() {
  let ctx = useContext(context);
  if (!ctx) {
    throw new Error(
      'Looks like you forgot to wrap your app with an <SdkProvider>. Cannot use useSdk() outside of an SdkContext.'
    );
  }
  return ctx;
}

export function SdkProvider(props: {
  query(this: void, url: string, params: Record<string, string | number>): void;
  mutate(this: void): void;
  children: ReactNode;
}) {
  let query = useCallback(
    (({ queryKey }) => {
      let url = queryKey[0] as string;
      let params = queryKey[1] as Record<string, string | number>;
      return props.query(url, params);
    }) as QueryFunction,
    [props.query]
  );
  let mutate = useCallback();
  return (
    <context.Provider value={{ query, mutate }}>
      props.children
    </context.Provider>
  );
}
