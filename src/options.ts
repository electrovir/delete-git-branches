import {defineShape} from 'object-shape-tester';

/**
 * Shape definition for {@link ConfigurableOptions}
 *
 * @category Internal
 */
export const configurableOptionsShape = defineShape({
    /**
     * Which remotes to wipe local tracking references from. This will _not_ delete any remote
     * branches.
     *
     * @default // all remotes (including origin)
     */
    remotesToWipe: [''],
    /**
     * The branches to explicitly _not_ delete.
     *
     * @default // all currently checked-out branches.
     */
    branchesToKeep: [''],
});

/**
 * All CLI user configurable options.
 *
 * @category Internal
 */
export type ConfigurableOptions = typeof configurableOptionsShape.runtimeType;
