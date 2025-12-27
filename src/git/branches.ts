import {assertWrap} from '@augment-vir/assert';
import {log, type PartialWithUndefined, trimAndSplitLines} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node';

/**
 * Information about a local branch.
 *
 * @category Internal
 */
export type GitLocalBranch = {
    branchName: string;
    isActive: boolean;
    remoteTracking?: GitRemoteRef | undefined;
};

/**
 * Information about a remote ref that is saved locally.
 *
 * @category Internal
 */
export type GitRemoteRef = {
    remoteBranchName: string;
    remoteName: string;
};

/**
 * Lists all local branches with their information.
 *
 * @category Internal
 */
export async function listLocalBranches({cwd}: {cwd: string | undefined}): Promise<{
    activeLocalBranches: GitLocalBranch[];
    inactivateLocalBranches: GitLocalBranch[];
}> {
    const {stdout} = await runShellCommand(
        // cspell:words worktreepath,remotename,lstrip
        `git branch --list --no-column --format='%(if)%(HEAD)%(then)*%(else)%(if)%(worktreepath)%(then)*%(else) %(end)%(end) %(refname:short) %(upstream:remotename) %(upstream:lstrip=3)'`,
        {
            rejectOnError: true,
            cwd,
        },
    );

    const lines = trimAndSplitLines(stdout);

    const activeLocalBranches: GitLocalBranch[] = [];
    const inactivateLocalBranches: GitLocalBranch[] = [];

    const branches = lines.map((line): GitLocalBranch => {
        const splits = line.split(' ');

        const isActive: boolean = splits[0] === '*' ? !!splits.shift() : false;

        const [
            branchName,
            remoteName,
            remoteBranchName,
        ] = splits;

        return {
            branchName: assertWrap.isTruthy(
                branchName,
                `Failed to extract branch name from '${line}'`,
            ),
            isActive,
            remoteTracking:
                remoteName && remoteBranchName
                    ? {
                          remoteBranchName,
                          remoteName,
                      }
                    : undefined,
        };
    });

    branches.forEach((branch) => {
        if (branch.isActive) {
            activeLocalBranches.push(branch);
        } else {
            inactivateLocalBranches.push(branch);
        }
    });

    return {
        activeLocalBranches,
        inactivateLocalBranches,
    };
}

/**
 * Lists all remote refs that are saved locally for the given remote.
 *
 * @category Internal
 */
export async function listRemoteRefs({
    cwd,
    remoteName,
}: {
    remoteName: string;
    cwd: string | undefined;
}): Promise<GitRemoteRef[]> {
    const {stdout} = await runShellCommand(
        `git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/${remoteName}/`,
        {
            rejectOnError: true,
            cwd,
        },
    );

    return trimAndSplitLines(stdout).map((branchName) => {
        return {
            remoteBranchName: branchName,
            remoteName,
        };
    });
}

/**
 * Delete the given list of local branches.
 *
 * @category Internal
 */
export async function deleteLocalBranches({
    branches,
    cwd,
    enabledLogging,
}: Readonly<
    {
        branches: ReadonlyArray<GitLocalBranch>;
    } & PartialWithUndefined<{
        cwd: string;
        enabledLogging: boolean;
    }>
>) {
    const branchNames = branches.map((branch) => branch.branchName);

    await runShellCommand(`git branch -D ${branchNames.join(' ')}`, {
        rejectOnError: true,
        cwd,
    });

    if (enabledLogging) {
        branchNames.forEach((branchName) => {
            log.faint(`Deleted ${branchName}`);
        });
    }
}

/**
 * Deletes the local copy of each given remote ref. This does _not_ delete branches on the remote's
 * server.
 *
 * @category Internal
 */
export async function deleteRemoteRefs({
    remoteRefs,
    cwd,
    enabledLogging,
}: Readonly<
    {
        remoteRefs: ReadonlyArray<GitRemoteRef>;
    } & PartialWithUndefined<{
        cwd: string;
        enabledLogging: boolean;
    }>
>) {
    const remoteNames = remoteRefs.map((remoteRef) =>
        [
            remoteRef.remoteName,
            remoteRef.remoteBranchName,
        ].join('/'),
    );

    await runShellCommand(`git branch -dr ${remoteNames.join(' ')}`, {
        rejectOnError: true,
        cwd,
    });

    if (enabledLogging) {
        remoteNames.forEach((remoteName) => {
            log.faint(`Removed ref ${remoteName}`);
        });
    }
}
