#!/bin/env bun

import tiged from "@yus-ham/tiged";
import { resolve, basename } from "path";
import { parseArgs } from "util";


const { values: options, positionals: argv } = parseArgs({ args: Bun.argv, strict: false })

Object.entries({
    f: 'force',
    h: 'help',
    p: 'production',
    prod: 'production',
})
.forEach(([alias, opt]) => options[alias] && (options[opt] = true))

if (options.help || !argv[2]) {
    console.info(
        'Usage:\n' +
        '  appinitr <source> [<directory>] [<options>]\n\n' +
        '  Source: project source which can be\n' +
        '    - user/repo   Github repository path\n' +
        '    - git url     Any git url\n\n' +
        '  Directory: download path destination. if ommited it will use current directory + project name\n\n' +
        '  Options:\n' +
        '    -f, --force        Overwrite if destination directory exists\n' +
        '    -p, --prod         Dont install devDependencies\n' +
        '    -h, --help         Show this help\n'
    )
    process.exit()
}

try {
    const dest = resolve(argv[3] || basename(argv[2] || ''))

    console.info('Downloading project into directory:', dest)

    await import(`${dest}/package.json`).then(() => {
        const { promise, resolve } = Promise.withResolvers()
        const commands = ['bun', 'install']
        options.production && commands.push('-p')
        Bun.spawn(commands, {
            stdout: 'inherit',
            stdin: 'inherit',
            onExit: resolve,
            cwd: dest,
        })
        return promise
    })
    .catch((err) => {
    })
} catch(err) {
    console.error('Failed:')
    console.info('  '+ err.message.replace('Use options.force', 'Use --force') +'\n')
}