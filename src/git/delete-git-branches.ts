import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, type PartialWithUndefined, type SelectFrom} from '@augment-vir/common';
import {type ConfigurableOptions} from '../options.js';
import {
    deleteLocalBranches,
    deleteRemoteRefs,
    type GitLocalBranch,
    type GitRemoteRef,
    listLocalBranches,
    listRemoteRefs,
} from './branches.js';
import {listAllRemotes} from './remotes.js';

/**
 * Options for {@link deleteGitBranches} and {@link listAllBranchesToDelete}.
 *
 * @category Internal
 */
export type DeleteGitBranchOptions = PartialWithUndefined<
    ConfigurableOptions & {
        /**
         * Which directory to run all git commands in.
         *
         * @default process.cwd()
         */
        cwd: string;
        /**
         * If true, logs will be printed.
         *
         * @default false
         */
        enableLogging: boolean;
    }
>;

/**
 * Deletes all local branches and locally saved remote refs according to the given options.
 *
 * @category Main
 */
export async function deleteGitBranches(options: Readonly<DeleteGitBranchOptions>) {
    const {localBranchesToDelete, remoteRefsToDelete} = await listAllBranchesToDelete(options);

    await deleteLocalBranches({
        branches: localBranchesToDelete,
        cwd: options.cwd,
        enabledLogging: options.enableLogging,
    });

    await deleteRemoteRefs({
        remoteRefs: remoteRefsToDelete,
        cwd: options.cwd,
        enabledLogging: options.enableLogging,
    });
}

/**
 * List all the local branches and locally saved remote refs to delete according to the given
 * options. This is equivalent to running the CLI with `--dryRun`.
 *
 * @category Main
 */
export async function listAllBranchesToDelete(
    options: Readonly<
        SelectFrom<
            DeleteGitBranchOptions,
            {
                branchesToKeep: true;
                cwd: true;
                remotesToWipe: true;
            }
        >
    >,
) {
    const {activeLocalBranches, inactivateLocalBranches} = await listLocalBranches({
        cwd: options.cwd,
    });

    const branchesToKeep: ReadonlyArray<Readonly<GitLocalBranch>> = [
        ...activeLocalBranches,
        ...(options.branchesToKeep || []).map((branchName): GitLocalBranch => {
            return {
                branchName,
                isActive: false,
            };
        }),
    ];

    const remoteNamesToWipe =
        options.remotesToWipe ||
        (await listAllRemotes({
            cwd: options.cwd,
        }));

    const remoteRefs: ReadonlyArray<Readonly<GitRemoteRef>> = (
        await awaitedBlockingMap(remoteNamesToWipe, async (remoteName) => {
            return await listRemoteRefs({
                cwd: options.cwd,
                remoteName,
            });
        })
    ).flat();

    const remoteRefsToDelete = remoteRefs.filter((remoteRef) => {
        return !branchesToKeep.some((localBranch) => {
            return check.deepEquals(localBranch.remoteTracking, remoteRef);
        });
    });
    const localBranchesToDelete = inactivateLocalBranches.filter((localBranch) => {
        return !options.branchesToKeep?.includes(localBranch.branchName);
    });

    return {
        remoteRefsToDelete,
        localBranchesToDelete,
    };
}
