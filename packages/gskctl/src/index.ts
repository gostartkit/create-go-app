#!/usr/bin/env node

import path from 'path';
import { Command } from 'commander';
import { bold, cyan, green, red, yellow } from 'picocolors';
import prompts, { type InitialReturnValue } from 'prompts';
import checkForUpdate from 'update-check';
import packageJson from '../package.json';
import { validateName, validatePrefix } from './validator';
import { getPkgManager } from './utils';

let projectName: string = ''

const handleSigTerm = () => process.exit(0)

process.on('SIGINT', handleSigTerm)
process.on('SIGTERM', handleSigTerm)

const onPromptState = (state: {
  value: InitialReturnValue
  aborted: boolean
  exited: boolean
}) => {
  if (state.aborted) {
    process.stdout.write('\x1B[?25h')
    process.stdout.write('\n')
    process.exit(1)
  }
}

const program = new Command()
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .argument('[project-name]')
  .usage(`${green('[project-name]')} [options]`)
  .action((name) => {
    projectName = name;
  })
  .option(
    '-p, --prefix <module-prefix-name>',
    `

  Prefix of module name. module name: $prefix/$project-name
`
  )
  .parse(process.argv);

const packageManager = getPkgManager()

async function run(): Promise<void> {

  const programName = program.name()

  const opts = program.opts()

  console.log("hello word")
}

const update = checkForUpdate(packageJson).catch(() => null)

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update
    if (res?.latest) {
      const updateMessage =
        packageManager === 'yarn'
          ? `yarn global add ${packageJson.name}`
          : packageManager === 'pnpm'
            ? `pnpm add -g ${packageJson.name}`
            : packageManager === 'bun'
              ? `bun add -g ${packageJson.name}`
              : `npm i -g ${packageJson.name}`

      console.log(
        yellow(bold(`A new version of ${packageJson.name} is available!`)) +
          '\n' +
          'You can update by running: ' +
          cyan(updateMessage) +
          '\n'
      )
    }
    process.exit()
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
      console.log(`  ${cyan(reason.command)} has failed.`)
    } else {
      console.log(
        red('Unexpected error. Please report it as a bug:') + '\n',
        reason
      )
    }
    console.log()
    await notifyUpdate()
    process.exit(1)
  })