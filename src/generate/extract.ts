import fs from 'fs';
import { relative } from 'path';
import * as parser from '@babel/parser';
import {
  File,
  FunctionDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';

export type EndpointDescriptor = NonNullable<
  ReturnType<typeof extractEndpointDescription>
>;

export function extractEndpointDescription(file: string, rootdir: string) {
  let filepath = relative(rootdir, file).split('.').slice(0, -1).join('.');
  let path = '/api/' + filepath;

  let ast = parser.parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  // Endpoint name
  let name = extractEndpointName(ast);
  if (!name) {
    console.warn(
      `Skipping ${path}, default export is not a named function declaration.`
    );
    return;
  }

  // Docblock comments
  let description = extractDocblockComment(ast);

  // Authenticate export
  let requiresAuth = extractAuthentication(ast);

  return {
    path,
    filepath,
    name,
    description,
    requiresAuth,
  };
}

function extractEndpointName(ast: parser.ParseResult<File>) {
  let defaultExport = ast.program.body.find(
    statement => statement.type === 'ExportDefaultDeclaration'
  ) as ExportDefaultDeclaration | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  let declaration = (defaultExport as any)
    ?.declaration as FunctionDeclaration | null;
  let name = declaration?.id?.name;
  return name;
}

function extractDocblockComment(ast: parser.ParseResult<File>) {
  let defaultExport = ast.program.body.find(
    statement => statement.type === 'ExportDefaultDeclaration'
  ) as ExportDefaultDeclaration | undefined;
  let description = defaultExport?.leadingComments?.[0]?.value
    .split('\n')
    .map(line => line.replace(/^[\s*]+/, ''))
    .join('\n');
  return description;
}

function extractAuthentication(ast: parser.ParseResult<File>) {
  let authExport = ast.program.body.find(
    statement => statement.type === 'ExportNamedDeclaration'
  ) as ExportNamedDeclaration | undefined;
  if (authExport?.declaration?.type === 'VariableDeclaration') {
    let variableDeclaration = authExport.declaration.declarations[0];
    if (variableDeclaration) {
      let id = variableDeclaration?.id;
      if ('name' in id && id.name === 'authenticate') {
        let init = variableDeclaration.init;
        if (init?.type === 'BooleanLiteral' && init.value === false) {
          return false;
        }
      }
    }
  }
  return true;
}
