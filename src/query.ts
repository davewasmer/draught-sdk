import { isEmpty } from 'lodash';
import populateEndpoint from './populate-endpoint';

/** Query the API at the given endpoint, using the supplied variables */
export default async function query(
  endpointUrl: string,
  params?: Record<string, string | number>
) {
  let url = endpointUrl;

  // Populate the url with the given params
  if (params) {
    let [populatedEndpoint, remainingParams] = populateEndpoint(
      endpointUrl,
      params
    );

    // If there are leftover params after we've populated the url segments,
    // add them as a search querystring
    if (!isEmpty(remainingParams)) {
      let queryParams = new URLSearchParams(remainingParams).toString();
      populatedEndpoint += '?' + queryParams;
    }
    url = populatedEndpoint;
  }

  // Guard against query running in SSR - usually the result of forgetting to
  // prefetch a query
  if (typeof window === 'undefined') {
    throw new Error(
      `React Query is trying to fetch data from ${url} during an SSR render pass. It should not be doing this - it should fetch data during getServerSideProps, not during render. You probably forgot to add the query hook to the prefetch list for this page.`
    );
  }

  // Fetch the endpoint
  let response = await fetch(url);
  let result: Record<string, any> = await response.json();
  if (result.error) {
    throw new Error(
      `Error while querying ${url}: ${JSON.stringify(result.error)}`
    );
  }
  return result;
}
