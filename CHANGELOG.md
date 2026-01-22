# Change log

## v1.0.3

- fix: correct vitest mock setup for constructor mocks
- fix: add contents write permission for git push
- fix: handle yarn.lock and improve changelog generation
- ci: auto-version bump and publish on push to main
- docs: update prolink-connect reference to alphatheta-connect
- chore: update package-lock.json
- chore: update dependencies for better performance
- chore: sync package-lock.json with v1.0.2 release


## v1.0.2

- test: add comprehensive unit tests for all modules
- docs: add related packages section to README
- chore: remove GitHub Actions, publish locally via 1Password

## v1.0.1

- fix: handle null return from execSync in release script
- chore: change license to MIT
- chore: trigger CI
- fix: correct 1Password secret path for npm token
- fix: exclude integration tests from default test run
- Add release script and changelog for automated npm publishing
- Add test workflow for PRs and non-main branches
- Add NPM publish workflow with 1Password integration
- fix(exports): add ESM import and default conditions to package exports
- Initial commit

## v1.0.0

- Initial release
