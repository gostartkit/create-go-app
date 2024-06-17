#!/usr/bin/env node

import { type InitialReturnValue } from 'prompts';
import { cyan, green, red, yellow, bold, blue } from 'picocolors'
import { Command } from 'commander';
import { validateName, validatePrefix } from './validator';
import prompts from 'prompts';
import packageJson from '../package.json';
import path from 'path';

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
    projectName = name
  })
  .option(
    '-p, --prefix <module-prefix-name>',
    `

  Prefix of module name. module name: $prefix/$project-name
`
  )
  .parse(process.argv);

async function run(): Promise<void> {

  if (!projectName) {
    const res = await prompts({
      onState: onPromptState,
      type: 'text',
      name: 'path',
      message: 'What is your project named?',
      initial: 'demo',
      validate: (name) => {
        const valid = validateName(path.basename(path.resolve(name)))
        if (valid) {
          return true
        }
        return 'Invalid project name: ' + name
      },
    })

    if (typeof res.path === 'string') {
      projectName = res.path.trim()
    }
  }

  const programName = program.name()

  if (!projectName) {
    console.log(
      '\nPlease specify the project name:\n' +
      `  ${cyan(programName)} ${green('<project-name>')}\n` +
      'For example:\n' +
      `  ${cyan(programName)} ${green('demo')}\n\n` +
      `Run ${cyan(`${programName} --help`)} to see all options.`
    )
    process.exit(1)
  }

  const opts = program.opts()

  let prefix = opts.prefix;

  if (!prefix) {
    const res = await prompts({
      onState: onPromptState,
      type: 'text',
      name: 'prefix',
      message: 'What is your prefix?',
      initial: 'app.gostartkit.com/go',
      validate: (prefix) => {
        const valid = validatePrefix(prefix)
        if (valid) {
          return true
        }
        return 'Invalid prefix: ' + prefix
      },
    })

    if (typeof res.prefix === 'string') {
      prefix = res.prefix.trim()
    }
  }

  if (!prefix) {
    console.log(
      '\nPlease specify the project name:\n' +
      `  ${cyan(programName)} ${green('--prefix <module-prefix-name>')}\n` +
      'For example:\n' +
      `  ${cyan(programName)} ${green('--prefix app.gostartkit.com/go')}\n\n` +
      `Run ${cyan(`${programName} --help`)} to see all options.`
    )
    process.exit(1)
  }
}


run()
  .then(function () {

  })
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
    process.exit(1)
  })