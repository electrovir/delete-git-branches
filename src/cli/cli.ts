import {log, wrapInTry, type PartialWithUndefined} from '@augment-vir/common';
import {confirm} from '@inquirer/prompts';
import {FlagRequirement, parseArgs} from 'cli-vir';
import {readJsonWithShape} from 'object-shape-tester';
import {deleteGitBranches, listAllBranchesToDelete} from '../git/delete-git-branches.js';
import {configurableOptionsShape} from '../options.js';
import {createDefaultOptionsFilePath, generateOptions} from './cli-options.js';

/**
 * Available additional commands.
 *
 * @category Internal
 */
export enum DeleteGitBranchesCommand {
    Options = 'options',
}

/**
 * Params for {@link runCli}.
 *
 * @category Internal
 */
export type RunCliParams = {
    /** Raw string args. Should usually be `process.argv`. */
    rawArgs: ReadonlyArray<string>;
} & PartialWithUndefined<{
    /**
     * The `import.meta` of the script calling this.
     *
     * @default undefined
     */
    importMeta: Readonly<ImportMeta>;
    /**
     * The binName of the script calling this.
     *
     * @default undefined
     */
    binName: string;
    /** @default process.cwd() */
    cwd: string;
}>;

/**
 * Run the `delete-git-branches` CLI.
 *
 * @category Main
 */
export async function runCli(params: Readonly<RunCliParams>) {
    const {dryRun, command, config, skipPrompts} = parseArgs(
        params.rawArgs,
        {
            dryRun: {
                description:
                    'If this flag is present, branches to delete are listed instead of actually deleted.',
                flag: {
                    valueRequirement: FlagRequirement.Blocked,
                },
            },
            config: {
                description:
                    'Custom path to an options file. This defaults to ~/.config/delete-git-branches.json',
                flag: {
                    valueRequirement: FlagRequirement.Required,
                },
            },
            command: {
                description:
                    'An extra command to run instead of the default "delete branches" command.',
                position: 0,
                type: DeleteGitBranchesCommand,
            },
            skipPrompts: {
                description: 'If set, no prompt to generate options is presented.',
                flag: {
                    valueRequirement: FlagRequirement.Blocked,
                },
            },
        },
        {
            binName: params.binName,
            importMeta: params.importMeta || import.meta,
        },
    );

    const optionsFilePath = config || createDefaultOptionsFilePath();
    const existingOptions = await wrapInTry(
        () => readJsonWithShape(optionsFilePath, configurableOptionsShape),
        {
            fallbackValue: undefined,
        },
    );

    const runOptionsAnyway =
        existingOptions || skipPrompts
            ? false
            : await confirm({
                  message: 'No options exist, would you like to populate them?',
                  default: true,
              });

    const shouldRunOptions = runOptionsAnyway || command === DeleteGitBranchesCommand.Options;

    if (shouldRunOptions) {
        await generateOptions({
            cwd: params.cwd,
        });
    } else if (dryRun) {
        const {localBranchesToDelete, remoteRefsToDelete} = await listAllBranchesToDelete({
            ...existingOptions,
            cwd: params.cwd,
        });

        log.warning('Local branches to delete:');
        localBranchesToDelete.forEach((localBranch) => {
            log.faint(`    ${localBranch.branchName}`);
        });

        log.warning('Remote refs to delete:');
        remoteRefsToDelete.forEach((remoteRef) => {
            log.faint(`    ${remoteRef.remoteName}/${remoteRef.remoteBranchName}`);
        });
    } else {
        await deleteGitBranches({
            ...existingOptions,
            cwd: params.cwd,
            enableLogging: true,
        });
    }
}
