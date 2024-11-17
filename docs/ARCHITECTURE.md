# LION Framework TypeScript Port

## Overview

The LION framework is being ported from Python to TypeScript, maintaining its core functionality while adapting to TypeScript's type system and ecosystem. This document outlines the architecture and translation strategy.

## Directory Structure

The TypeScript port follows a similar structure to the Python version:

```
src/
├── core/           # Core functionality
│   ├── session.ts  # Branch and session management
│   └── types.ts    # Core type definitions
├── integrations/   # External integrations (e.g., LiteLLM)
├── libs/           # Utility libraries
├── models/         # Base model implementations
├── protocols/      # Protocol definitions
└── types/         # TypeScript type definitions
```

## Key Components Translation

### 1. Base Models System

Python's Pydantic models are translated to TypeScript using a combination of:
- Zod for runtime validation
- TypeScript decorators for field definitions
- Class-based model system

Key differences from Python:
- Using TypeScript's type system instead of Python's type hints
- Implementing custom decorators instead of Pydantic's
- Handling undefined values explicitly with UNDEFINED constant

### 2. Configuration System

The settings system is translated with:
- TypeScript interfaces for config types
- Const objects for default configurations
- Class-based settings management

### 3. Branch System

The Branch system maintains similar functionality but adapted for TypeScript:
- Async/await for asynchronous operations
- Event emitter pattern for TypeScript
- Strong typing for messages and actions

## Key Type Translations

| Python Type | TypeScript Type |
|------------|----------------|
| dict       | Record<string, any> |
| list       | Array<T> |
| Optional   | T \| undefined |
| Any        | any |
| Callable   | (...args: any[]) => any |

## Implementation Notes

1. **Model System**
   - Using decorators for field definitions
   - Custom validation system
   - Type-safe undefined handling

2. **Async Operations**
   - Promise-based async operations
   - TypeScript async/await syntax
   - Strong typing for async results

3. **Type Safety**
   - Strict TypeScript configuration
   - Runtime type checking
   - Custom type guards

## Translation Progress

- [x] Base project setup
- [x] Core types definition
- [x] Base model system
- [ ] Field model system
- [ ] Branch implementation
- [ ] Integration system
- [ ] Protocol definitions
- [ ] Utility functions

## Key Differences from Python Version

1. **Type System**
   - TypeScript's structural typing vs Python's nominal typing
   - Runtime type checking implementation
   - Generic type handling

2. **Model Validation**
   - Custom decorator-based validation
   - Zod schema validation
   - Runtime type checking

3. **Async Handling**
   - Promise-based async operations
   - TypeScript async/await patterns
   - Event handling differences

## Development Guidelines

1. **Type Safety**
   - Use strict TypeScript configuration
   - Avoid any type when possible
   - Implement proper type guards

2. **Testing**
   - Unit tests for all components
   - Type testing
   - Integration testing

3. **Documentation**
   - TSDoc comments
   - Type definitions
   - Usage examples

## Next Steps

1. Complete the field model system
2. Implement the Branch class
3. Setup the integration system
4. Add protocol definitions
5. Implement utility functions
6. Add comprehensive tests
7. Add documentation and examples

## Notes on Specific Components

### Models
- BaseModel: Foundation for all models
- SchemaModel: Strict validation model
- FieldModel: Field definitions
- OperableModel: Extensible model

### Core
- Branch: Main session management
- Types: Core type definitions
- Session: Session management

### Integrations
- LiteLLM integration
- OpenAI integration
- Custom integrations support
