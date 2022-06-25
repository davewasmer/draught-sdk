import fs from 'fs';
import { defaults } from 'lodash';

let configPath = '.draught';
let defaultConfig = {
  dir: 'api',
  errorTypeImport: "import { ErrorPayload } from 'lib/errors';",
  output: 'lib/sdk.ts',
};
let configFileContents = fs.existsSync(configPath)
  ? fs.readFileSync(configPath, 'utf8')
  : '{"sdk":{}}';
let config: typeof defaultConfig = JSON.parse(configFileContents);
config = defaults(config, defaultConfig);

export default config;
