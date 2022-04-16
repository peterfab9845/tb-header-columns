# Header Columns
This addon allows customized columns to be added to the message list.
These columns show information based on header content, through a user-specified set of modifications such as search/replace and concatenation.

## Installation
Install from the [Mozilla add-ons page (TODO)](), or use `build.sh` to produce an unsigned XPI file to install manually.

## Usage
TODO, take from API readme

However, there will be no information for existing messages unless the database is rebuilt for the desired folders (Folder Properties > Repair Folder).
Note that rebuilding a folder will reset its column layout and sort order.

## Cloning
Note that this repo uses git submodules, so it needs to be cloned using the `--recurse-submodules` option. If this is skipped, then `git submodule update --init` can be used after the fact.

## Credits
This addon uses the [HeaderColumns](https://github.com/peterfab9845/header-columns-api), [LegacyPrefs](https://github.com/thundernest/addon-developer-support/tree/master/auxiliary-apis/LegacyPrefs), and [ex_runtime](https://github.com/rsjtdrjgfuzkfg/thunderbird-experiments/tree/master/experiments/runtime) experiment APIs.

