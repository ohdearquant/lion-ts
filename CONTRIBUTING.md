# Contributing to LION TypeScript

Thank you for your interest in contributing to LION TypeScript! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. **Prerequisites**
   - Node.js 16+
   - npm or yarn
   - TypeScript 4.5+
   - A code editor (VS Code recommended)

2. **Initial Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/lion-ts.git
   cd lion-ts

   # Install dependencies
   npm install

   # Build the project
   npm run build

   # Run tests
   npm test
   ```

## Code Style Guidelines

### TypeScript Guidelines

1. **Type Safety**
   - Use strict TypeScript configuration
   - Avoid `any` type when possible
   - Implement proper type guards
   - Use generics when appropriate

   ```typescript
   // Good
   function getValue<T>(key: string): T | undefined {
     // Implementation
   }

   // Bad
   function getValue(key: string): any {
     // Implementation
   }
   ```

2. **Async Code**
   - Use async/await over raw promises
   - Handle errors properly
   - Provide proper return types

   ```typescript
   // Good
   async function fetchData(): Promise<Data> {
     try {
       const result = await api.get();
       return result;
     } catch (error) {
       handleError(error);
       throw error;
     }
   }

   // Bad
   function fetchData() {
     return api.get().then(result => result);
   }
   ```

3. **Documentation**
   - Use TSDoc comments for public APIs
   - Include examples in documentation
   - Document complex algorithms

   ```typescript
   /**
    * Processes a message with the given metadata.
    * 
    * @param content - The message content
    * @param metadata - Additional metadata for the message
    * @returns A processed message object
    * 
    * @example
    * ```typescript
    * const result = await processMessage("Hello", { source: "user" });
    * ```
    */
   async function processMessage(content: string, metadata?: MessageMetadata): Promise<Message> {
     // Implementation
   }
   ```

### Testing Guidelines

1. **Test Coverage**
   - Write unit tests for all new code
   - Include integration tests where appropriate
   - Test edge cases and error conditions

2. **Test Structure**
   ```typescript
   describe('ComponentName', () => {
     describe('methodName', () => {
       it('should handle normal case', async () => {
         // Test implementation
       });

       it('should handle error case', async () => {
         // Test implementation
       });
     });
   });
   ```

## Pull Request Process

1. **Branch Naming**
   - feature/feature-name
   - fix/bug-description
   - docs/documentation-change
   - refactor/refactor-description

2. **Commit Messages**
   - Use clear, descriptive commit messages
   - Follow conventional commits format
   - Reference issues when applicable

   ```
   feat(core): add message validation
   fix(models): handle undefined fields correctly
   docs(readme): update installation instructions
   ```

3. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Description of testing performed

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Type definitions updated
   - [ ] All tests passing
   ```

## Project Structure

```
src/
├── core/           # Core functionality
├── integrations/   # External integrations
├── libs/          # Utility libraries
├── models/        # Base model implementations
├── protocols/     # Protocol definitions
└── types/         # TypeScript type definitions
```

### Component Guidelines

1. **Models**
   - Extend appropriate base classes
   - Implement required interfaces
   - Include proper validation

2. **Core Components**
   - Keep components focused and single-purpose
   - Use dependency injection when possible
   - Document public APIs thoroughly

3. **Utilities**
   - Keep utilities pure when possible
   - Include proper error handling
   - Document parameters and return types

## Release Process

1. **Version Bumping**
   - Follow semantic versioning
   - Update CHANGELOG.md
   - Update documentation if needed

2. **Testing**
   - Run full test suite
   - Perform manual testing
   - Check documentation accuracy

3. **Publishing**
   - Build the project
   - Update npm package
   - Tag release in git

## Questions and Support

- Open an issue for bugs or feature requests
- Use discussions for questions and support
- Join our community chat for real-time discussion

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## License

By contributing to LION TypeScript, you agree that your contributions will be licensed under the Apache License 2.0.
