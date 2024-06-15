#!/usr/bin/env node

import { Command } from 'commander';
import packageJson from '../package.json';

const program = new Command();

program
  .name('create-go-app')
  .description('help you create go app easy.')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize something')
  .action(() => {
    console.log('Initialization complete.');
  });

program
  .command('generate <name>')
  .description('Generate a new resource')
  .action((name: string) => {
    console.log(`Generating resource: ${name}`);
  });

program.parse(process.argv);
