import fs from 'fs';
import { findUpSync } from 'find-up';
import { defaults } from 'lodash';

let configPath = findUpSync('.draught');
let defaultConfig = {
  dir: 'api',
  errorTypeImport: "import { ErrorPayload } from 'lib/errors';",
  output: 'lib/sdk.ts',
};
let config: typeof defaultConfig = configPath
  ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    JSON.parse(fs.readFileSync(configPath, 'utf8')).sdk
  : {};
config = defaults(config, defaultConfig);

export default config;
