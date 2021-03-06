import fs from 'fs';
import path from 'path';
import glob from 'glob';
import template from './sdk-header';
import { extractEndpointDescription } from './extract';
import { generateQueryHook, generateMutationHook } from './generate-hooks';
import config from '../config';

if (!config.errorTypeImport.includes('ErrorPayload')) {
  throw new Error(
    'You must supply an `errorTypeImport` in your .draught config file under sdk.errorTypeImport, and you must (re)name your error type to "ErrorPayload".'
  );
}

process.stdout.write('\nGenerating SDK ... ');
let start = Date.now();

let queries: string[] = [];
let mutations: string[] = [];

glob.sync(`${config.dir}/**/*.query.ts`).forEach(file => {
  if (file.endsWith('.mock.query.ts')) {
    return;
  }
  let descriptor = extractEndpointDescription(file, config.dir);
  if (descriptor) {
    queries.push(generateQueryHook(descriptor));
  }
});
glob.sync(`${config.dir}/**/*.mutation.ts`).forEach(file => {
  if (file.endsWith('.mock.mutation.ts')) {
    return;
  }
  let descriptor = extractEndpointDescription(file, config.dir);
  if (descriptor) {
    mutations.push(generateMutationHook(descriptor));
  }
});

let sdk = template(config.errorTypeImport);
sdk += queries.join('\n\n');
sdk += mutations.join('\n\n');
sdk += '\n';

if (!fs.existsSync(path.dirname(config.output))) {
  fs.mkdirSync(path.dirname(config.output), { recursive: true });
}
fs.writeFileSync(config.output, sdk);

process.stdout.write(
  `Generated hooks for ${queries.length} queries, ${
    mutations.length
  } mutations in ${Date.now() - start}ms`
);
