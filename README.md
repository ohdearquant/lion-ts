# LION TypeScript

A TypeScript port of the LION framework for building robust AI applications.

## Overview

LION TypeScript is a powerful framework for building AI applications with strong typing and modern JavaScript/TypeScript features. It provides a structured way to handle:

- AI Model Integration
- Message Processing
- Action Management
- Session Handling
- Extensible Components

## Installation

```bash
npm install lion-ts
```

## Quick Start

```typescript
import { Branch, Settings } from 'lion-ts';

// Create a new branch
const branch = new Branch({
  name: 'my-branch',
  user: 'user-1'
});

// Process messages
await branch.processMessage('Hello, world!', {
  metadata: {
    source: 'user'
  }
});

// Execute actions
await branch.executeAction('greet', {
  name: 'John'
});
```

## Key Features

- **Type Safety**: Built with TypeScript for maximum type safety and IDE support
- **Model Validation**: Runtime validation with Zod
- **Extensible**: Easy to extend with custom components and integrations
- **Async First**: Built for modern async/await patterns
- **AI Ready**: Integrates easily with AI models and services

## Architecture

The framework is organized into several key components:

- **Core**: Base functionality and session management
- **Models**: Data model definitions and validation
- **Integrations**: External service integrations
- **Protocols**: Communication protocols
- **Utils**: Utility functions and helpers

For detailed architecture information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- TypeScript 4.5+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/lion-ts.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
src/
├── core/           # Core functionality
├── integrations/   # External integrations
├── libs/          # Utility libraries
├── models/        # Base model implementations
├── protocols/     # Protocol definitions
└── types/         # TypeScript type definitions
```

## Usage Examples

### Basic Message Processing

```typescript
import { Branch } from 'lion-ts';

const branch = new Branch();

// Process a message
const result = await branch.processMessage('Hello!');
console.log(result);
```

### Custom Actions

```typescript
import { Branch } from 'lion-ts';

const branch = new Branch();

// Register a custom action
branch.registerTool('greet', async (args: { name: string }) => {
  return `Hello, ${args.name}!`;
});

// Execute the action
const result = await branch.executeAction('greet', { name: 'World' });
console.log(result); // "Hello, World!"
```

### Configuration

```typescript
import { Settings } from 'lion-ts';

// Configure the framework
const settings = new Settings({
  Branch: {
    messageConfig: {
      validationMode: 'raise',
      autoRetries: true
    }
  }
});
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This is a TypeScript port of the original Python LION framework, maintaining its core functionality while adapting to TypeScript's ecosystem.
