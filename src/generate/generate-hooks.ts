import dedent from 'dedent';
import { upperFirst } from 'lodash';
import { EndpointDescriptor } from './extract';

export function generateQueryHook(desc: EndpointDescriptor) {
  let Name = upperFirst(desc.name);
  let Endpoint = `${Name}Query`;
  return dedent`
      import type ${Endpoint} from 'api/${desc.filepath}';
      /**
       * ${desc.description ?? `GET ${desc.path}`}
       *
       * |||
       * |:-|-:|
       * | Auth           | ${desc.requiresAuth ? '' : 'not '}required     |
       * | Endpoint       | \`GET ${
         desc.path
       }\`                                |
       * | Defined in     | \`${desc.filepath}.ts\`  |
       */
      export function use${Name}(input: InputFor<typeof ${Endpoint}>, options?: QueryOptions<typeof ${Endpoint}>) {
        let key = ['${desc.path}', input];
        return useQuery<ResponseFor<typeof ${Endpoint}>, ErrorPayload>(
          key,
          query(
            ${
              desc.mockPath
                ? `process.env.NODE_ENV === 'development' ? require('${desc.mockPath}') : null`
                : 'null'
            }
          ),
          options
        ).data!;
      }
      use${Name}.endpoint = '${desc.path}';
    `;
}
export function generateMutationHook(desc: EndpointDescriptor) {
  let Name = upperFirst(desc.name);
  let Endpoint = `${Name}Mutation`;
  return dedent`
      import type ${Endpoint} from 'api/${desc.filepath}';
      /**
       * ${desc.description ?? `POST ${desc.path}`}
       *
       * |||
       * |:-|-:|
       * | Auth           | ${desc.requiresAuth ? '' : 'not '}required     |
       * | Endpoint       | \`POST ${
         desc.path
       }\`                                |
       * | Defined in     | \`${desc.filepath}.ts\`  |
       */
      export function use${Name}(options?: MutationOptions<typeof ${Endpoint}>) {
        let client = useQueryClient();
        return useMutation<ResponseFor<typeof ${Endpoint}>, ErrorPayload, InputFor<typeof ${Endpoint}>>(
          makeMutate<InputFor<typeof ${Endpoint}>>(
            '${desc.path}',
            ${
              desc.mockPath
                ? `process.env.NODE_ENV === 'development' ? require('${desc.mockPath}') : null`
                : 'null'
            }
          ),
          addInvalidationHandling(options, client)
        ).mutateAsync;
      }
    `;
}
