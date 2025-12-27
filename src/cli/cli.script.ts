import {log} from '@augment-vir/common';
import {runCli} from './cli.js';

try {
    await runCli({
        importMeta: import.meta,
        rawArgs: process.argv,
        binName: 'delete-git-branches',
    });
    process.exit(0);
} catch (error) {
    log.error(error);
    process.exit(1);
}
