import {log} from '@augment-vir/common';
import {writeJsonFile} from '@augment-vir/node';
import {checkbox, confirm, editor} from '@inquirer/prompts';
import {csvParseRows} from 'd3-dsv';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {listAllRemotes} from '../git/remotes.js';
import {type ConfigurableOptions} from '../options.js';

const branchesToKeepMessage =
    'List branch names to keep (not delete), in CSV format (separated by commas, wrapped in double quotes if name contains a comma):';

/**
 * Run an interactive process to generate an options file.
 *
 * @category Internal
 */
export async function generateOptions({cwd}: {cwd: string | undefined}) {
    const remotes = await listAllRemotes({cwd});

    log.faint('Entering interactive options generator...');

    const remotesToWipe: string[] =
        remotes.length > 1
            ? await checkbox({
                  choices: remotes,
                  message: "Choose which remotes you'd like to remove locally saved refs for:",
              })
            : remotes;

    const branchesToKeep = processBranchesToKeep(
        await editor({
            message: branchesToKeepMessage,
            default: `# ${branchesToKeepMessage}`,
            waitForUserInput: false,
        }),
    );

    const options: ConfigurableOptions = {
        branchesToKeep,
        remotesToWipe,
    };

    log.info('Generated options:');
    log.faint(JSON.stringify(options, null, 4));

    if (
        !(await confirm({
            message: 'Does that look right?',
        }))
    ) {
        throw new Error('Aborted by user.');
    }

    const writePath = createDefaultOptionsFilePath();

    await writeJsonFile(writePath, options);
    log.success(`Options written to: ${writePath}`);
}

function processBranchesToKeep(data: string): string[] {
    const dataWithoutComments: string = data
        .split('\n')
        .filter((line) => {
            return line.trim().startsWith('#');
        })
        .join('\n');

    const branchNames = csvParseRows(dataWithoutComments).flat();

    return branchNames;
}

/**
 * Generate the default options file path.
 *
 * @category Internal
 */
export function createDefaultOptionsFilePath() {
    return join(homedir(), '.config', 'git-delete-branches.json');
}
