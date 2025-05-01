# Contributing to Audiograde

First off, thank you for considering contributing to Audiograde! This document provides guidelines and steps for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Add information about your environment (browser, OS, Audiograde version)

### Suggesting Features

- Check if the feature has already been suggested in the Issues section
- Use the feature request template when creating a new issue
- Describe the feature in detail and why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure they pass (`npm test`)
5. Commit your changes (`git commit -m 'Add feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

1. Clone your fork:
   ```
   git clone https://github.com/your-username/audiograde.git
   cd audiograde
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a branch for your changes:
   ```
   git checkout -b your-branch-name
   ```

4. Start the development server:
   ```
   npm start
   ```

## Testing

- Always add tests for new features or bug fixes
- Run the test suite before submitting a PR:
  ```
  npm test
  ```

## Coding Style Guidelines

- Follow the existing code style
- Use meaningful variable and function names
- Document complex functions with comments
- Keep functions small and focused on a single responsibility
- Properly handle errors and edge cases

## Commit Message Guidelines

- Use concise, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add feature" not "Added feature")
- Reference issue numbers when applicable (e.g., "Fix #123: Resolve login issue")

## Documentation

- Update the README.md if your changes affect how the application is used
- Add JSDoc comments to new functions and classes
- Update or create documentation for new features

## Review Process

1. A maintainer will review your pull request
2. They may request changes or ask questions
3. Once approved, a maintainer will merge your PR
4. Your contribution will be acknowledged in the project

Thank you for your contributions!