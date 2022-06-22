import { omit } from 'lodash';

/**
 * URL segement parameters are delimited by square brackets, i.e.
 * /api/posts/[id].ts
 */
const endpointParamDelimiter = /\[([\s\S]+?)\]/g;

/**
 * Given a parameterized endpoint (i.e. "/api/posts/[id]") and a map of
 * variables (i.e. { id: 123 }), fill in the parameter segments to create a
 * concrete URL
 */
export default function populateEndpoint(
  endpoint: string,
  params: Record<string, string | number>
) {
  let omitList = [] as string[];
  let populatedEndpoint = endpoint.replace(
    endpointParamDelimiter,
    (_, paramName: string) => {
      if (!(paramName in params)) {
        throw new Error('Missing url param');
      }
      omitList.push(paramName);
      return String(params[paramName]);
    }
  );
  return [populatedEndpoint, omit(params, omitList)] as const;
}
