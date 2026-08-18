---
name: conventional-commits
description: Enforces Conventional Commits format for all git commits.
trigger: always_on
---
# Conventional Commits Rule

You MUST use the Conventional Commits format for all git commit messages in this repository. 
The user wants to manage the commit history carefully.

Format: `<type>: <description>`

Available Types:
- `feat`: A new feature for the user.
- `fix`: A bug fix for the user.
- `docs`: Changes to the documentation.
- `style`: Formatting, missing semi-colons, etc. (no production code change).
- `refactor`: Refactoring production code (neither fixes a bug nor adds a feature).
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Updating build tasks, package manager configs, etc.

Example:
`git commit -m "feat: Add pixel hit sound effect for zombies"`
