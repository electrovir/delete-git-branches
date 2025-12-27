# delete-git-branches

A CLI to delete all local branches and locally saved remote branch references.

## Install

```sh
npm i -g delete-git-branches
```

## Usage

```sh
delete-git-branches
```

`delete-git-branches --help` output:

```
NAME
    delete-git-branches

SYNOPSIS
    delete-git-branches [options] [<command>]

POSITIONAL ARGUMENTS
    <command>                   An extra command to run instead of the default "delete branches" command. (optional; type: options)

OPTIONS
    (All option keys are case-insensitive; snake_case, camelCase, and kebab-case variants are accepted.)

    --config <string>           Custom path to an options file. This defaults to ~/.config/delete-git-branches.json  (type: string; value required)
    --dry-run                   If this flag is present, branches to delete are listed instead of actually deleted.
    --help                      Print this help message.
    --skip-prompts              If set, no prompt to generate options is presented.
```

API reference: https://electrovir.github.io/delete-git-branches
