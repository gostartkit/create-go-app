'use strict';

import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

let projectName;

export const init = () => {
    console.log("we are here.", packageJson.type);
}