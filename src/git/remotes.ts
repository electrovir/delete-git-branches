import {check} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node';

/**
 * List all existing remote names.
 *
 * @category Internal
 */
export async function listAllRemotes({cwd}: {cwd: string | undefined}): Promise<string[]> {
    const {stdout} = await runShellCommand(`git remote show`, {
        rejectOnError: true,
        cwd,
    });

    return filterMap(stdout.trim().split('\n'), (line) => line.trim(), check.isTruthy);
}
