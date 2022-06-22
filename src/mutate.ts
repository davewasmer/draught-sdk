import { isEmpty } from 'lodash';
import populateEndpoint from './populate-endpoint';

/** Query the API at the given endpoint, using the supplied variables */
export default async function mutate(
  endpoint: string,
  params: Record<string, any> | void
) {
  let url = endpoint;

  // Populate URL segments
  if (params) {
    let [populatedEndpoint, remainingParams] = populateEndpoint(
      endpoint,
      params
    );
    url = populatedEndpoint;
    params = remainingParams;
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
}
