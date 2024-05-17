#!/bin/env bun

import tiged from "@yus-ham/tiged";
import { resolve, basename } from "path";
import { parseArgs, styleText } from "util";


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
    const package_json = await import('./package.json')

    console.info(styleText('cyan', styleText('bold', `\n  AppInitr ${package_json.version} `) + '- Clone and install javascript project from any git source\n'))
    console.info('Downloading project into directory:', dest)

    const tiger = tiged(argv[2], {force: options.force, keepVcs: true, mode: 'git'})

    tiger.on('warn', (err) => {
        console.info(styleText('yellow', err.message), '\n')
    })

    tiger.on('info', (info) => {
        console.info(styleText('cyanBright', `${info.message}\n`))
    })

    await tiger.clone(dest)
    console.info('')

    import(`${dest}/package.json`).then(async (pkg_meta) => {
        const { promise, resolve: onExit } = Promise.withResolvers()
        const commands = ['bun', 'install', '--ignore-scripts']
        options.production && commands.push('-p')

        console.info(styleText('magenta', styleText('bold', '$')), ...commands)
        Bun.spawn(commands, {
            stdout: 'inherit',
            stdin: 'inherit',
            cwd: dest,
            onExit,
        })
        await promise

        // workaround to https://github.com/oven-sh/bun/issues/11077
        // postinstall need to be run separately
        if (pkg_meta.scripts.postinstall) {
            commands.splice(0)
            commands.push(...pkg_meta.scripts.postinstall.split(' '))
            console.info(styleText('magenta', styleText('bold', '$')), ...commands)

            Bun.spawn(commands, {
                env: {...Bun.env, BUN_ENV: options.production && 'production'},
                stdout: 'inherit',
                stdin: 'inherit',
                cwd: dest,
            })
        }
    })
    .catch((err) => {
        console.info(styleText('yellow', 'No package.json found, skip deps installs'))
    })
} catch(err) {
    console.error('\nFailed:')
    console.info('  '+ err.message.replace('Use options.force', 'Use --force') +'\n')
}