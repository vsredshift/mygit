# The `status` command

- It will show:
    - **Modified files**: files that exist in the current commit but have different content now.
    - **New files**: files in the working directory that aren't in the current commit.
    - **Deleted files**: files in the current commit that no longer exist in the working directory.

- Get the current commit from HEAD
- Read that commit's tree to see what files should exist
- Scan the working directory to see what files actually exist
- compare the two and categorize the diferences

## implementation explained
The `status` command is implemented in the `src/commands/status.js` file. We are importing some helper functions for this implementation. 

- `colors` - An object with diferent ansi scape colors for better formatting
- The `readObject()` function from `src/helpers/readObject.js`.
- The `parseTree()` function from `src/helpers/parseTree.js`.
- The `getCurrentBranch()` function from `src/helpers/getCurrentBranch.js`.
- The `getCurrentCommit()` function form `src/helpers/getCurrentCommit.js`.

There are other functions in this file:
