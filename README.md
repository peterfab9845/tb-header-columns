# X-Original-To Column
This addon adds a new column called X-Original-To in the message list which shows the original recipient address of the message (the contents of the X-Original-To header).
This can be useful for systems with catch-all email addresses.

## Installation
Install from the [Mozilla add-ons page](https://addons.thunderbird.net/en-US/thunderbird/addon/x-original-to-column/), or use `build.sh` to produce an unsigned XPI file to install manually.

## Usage
The new column can be selected as soon as the addon has been installed, and all new messages will automatically have their X-Original-To header recorded.

However, there will be no information for existing messages unless the database is rebuilt for the desired folders (Folder Properties > Repair Folder).
Note that rebuilding a folder will reset its column layout and sort order.

## Credits
This addon uses the [HeaderColumns](https://github.com/peterfab9845/header-columns-api), [LegacyPrefs](https://github.com/thundernest/addon-developer-support/tree/master/auxiliary-apis/LegacyPrefs), and [ex_runtime](https://github.com/rsjtdrjgfuzkfg/thunderbird-experiments/tree/master/experiments/runtime) experiment APIs.

