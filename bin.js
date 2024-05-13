#!/bin/env bun

import mri from "mri";
import tiged from "@yus-ham/tiged";
import { resolve, basename } from "path";

const argv = mri(process.argv, {
    alias: { f: 'force', h: 'help' }
})

if (argv.help || !argv._[2]) {
    console.info(
        'Usage:\n' +
        '  appinitr <source> [<directory>] [<options>]\n\n' +
        '  Source: project source which can be\n' +
        '    - user/repo   Github repository path\n' +
        '    - git url     Any git url\n\n' +
        '  Directory: download path destination. if ommited it will use current directory + project name\n\n' +
        '  Options:\n' +
        '    --force    overwrite if destination directory exists\n' +
        '    --help     Show this help\n'
    )
    process.exit()
}

try {
    const dest = resolve(argv._[3] || basename(argv._[2] || ''))

    console.info('Downloading project into directory:', dest)

    await tiged(process.argv[2], {force: argv.force}).clone(dest)

    const app_package_json = await import(`${dest}/package.json`)

    for (const [name, script] of Object.entries(app_package_json.scripts)) {
        if (name === 'app:init') {
            await Bun.$`${script.split(' ')}`.cwd(dest)
            break;
        }
    }
} catch(err) {
    console.error('Failed:')
    console.info('  '+ err.message.replace('Use options.force', 'Use --force') +'\n')
}