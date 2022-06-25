import { isEmpty } from 'lodash';
import { MutationFunction } from 'react-query';
import isMocking, { mockCtx, MockEndpoint } from './mock';
import populateEndpoint from './populate-endpoint';

/** Query the API at the given endpoint, using the supplied variables */
export default function mutate<Input extends Record<string, any>>(
  endpoint: string,
  mock: MockEndpoint<any> | null
) {
  return async function mutate(params: Input) {
    let url = endpoint;

    // Populate URL segments
    if (params) {
      let [populatedEndpoint, remainingParams] = populateEndpoint(
        endpoint,
        params
      );
      url = populatedEndpoint;
      params = remainingParams as any;
    }

    if (mock && isMocking()) {
      return mock(mockCtx, url, params);
    }

    // POST to the endpoint with any params leftover from populating the URL
    let response = await fetch(url, {
      body: !params || isEmpty(params) ? undefined : JSON.stringify(params),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });
    let result: Record<string, any> | null;
    try {
      result = await response.json();
    } catch (e) {
      result = null;
    }
    if (result?.error) {
      throw new Error(
        `Error while mutating ${url}: ${JSON.stringify(result.error)}`
      );
    }
    return result;
  } as MutationFunction;
}
