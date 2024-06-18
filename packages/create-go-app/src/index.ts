#!/usr/bin/env node

import { open, mkdir } from 'node:fs/promises';
import path from 'path';
import { Command } from 'commander';
import { bold, cyan, green, red, yellow } from 'picocolors';
import prompts, { type InitialReturnValue } from 'prompts';
import checkForUpdate from 'update-check';
import packageJson from '../package.json';
import { AppFiles, AppGitRev, StubVersion } from './data';
import { validateName, validatePrefix } from './validator';
import { getPkgManager, randomString, replaceWithMap } from './utils';

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

  const decoder = new TextDecoder("utf-8");
  const stubModuleName = "gostartkit.com/go/app";
  const moduleName = `${prefix}/${projectName}`;

  const v = {
    Key: projectName,
    ModuleName: moduleName,
    DatabaseDriver: "mysql",
    DatabaseHost: "127.0.0.1",
    DatabaseName: projectName,
    DatabaseUser: projectName,
    DatabaseRootPassword: randomString(32),
    DatabasePassword: randomString(32),
    DatabaseCharset: "utf8",
    DatabaseCollation: "utf8_general_ci",
    StubVersion: StubVersion,
    StubGitRev: AppGitRev
  };

  for (const f of AppFiles) {
    const rel = f.key;
    const codeFile = path.join(projectName, rel);
    let value = decoder.decode(f.value);
    if (rel.endsWith(".go") || rel.endsWith(".mod")) {
      value = value.replace(new RegExp(stubModuleName, 'g'), moduleName);
    }
    value = replaceWithMap(value, v);
    const dir = path.dirname(codeFile);

    try {
      await mkdir(dir, { recursive: true });
    } catch (err: any) {
      console.log(`mkdir: ${err}`)
    }

    let w = null;

    try {
      w = await open(codeFile, "w");
      w.write(value);
    }
    catch (err: any){
      console.log(`write: ${err}`)
    }
    finally {
      await w?.close();
    }
  }
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