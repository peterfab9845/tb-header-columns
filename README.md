# X-Original-To column
This addon adds a new column called X-Original-To in the message list which shows the original recipient address of the message (the contents of the X-Original-To header).
This can be useful for systems with catch-all email addresses.

## Usage
The new column can be selected as soon as the addon has been installed.

When the addon is installed, it will automatically add the X-Original-To header to the preference `mailnews.customDBHeaders`.
All new messages will then include the X-Original-To field in the message database; however, the field will not be populated for existing messages unless the database is rebuilt (Folder Properties > Repair Folder).
Note that rebuilding the folder database will reset the column layout and sort order for the folder.

## Credits
This addon source is based on [Full address column](https://github.com/lkosson/full-address-column/) by Łukasz Kosson, which in turn is based on [SFreq](https://addons.thunderbird.net/en-us/thunderbird/addon/sender-frequency/) by Jorg K.

