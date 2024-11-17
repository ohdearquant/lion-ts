import { Element } from 'lion/core/generic/element';
import { Any, Field, Literal, override } from 'lion/core/typing';
import { functionToSchema, toList } from 'lion/libs/parse';

type Callable = (...args: any[]) => Any;

class Tool extends Element {
  function: Callable = Field(
    {
      description: 'The callable function of the tool.',
    }
  );
  schema_: { [key: string]: Any } | null = Field(
    {
      default: null,
      description: 'Schema of the function in OpenAI format.',
    }
  );
  preProcessor: Callable | null = Field(
    {
      default: null,
      description: 'Function to preprocess input arguments.',
    }
  );
  preProcessorKwargs: { [key: string]: Any } | null = Field(
    {
      default: null,
      description: 'Keyword arguments for the pre-processor.',
    }
  );
  postProcessor: Callable | null = Field(
    {
      default: null,
      description: 'Function to post-process the result.',
    }
  );
  postProcessorKwargs: { [key: string]: Any } | null = Field(
    {
      default: null,
      description: 'Keyword arguments for the post-processor.',
    }
  );
  parser: Callable | null = Field(
    {
      default: null,
      description: 'Function to parse result to JSON serializable format.',
    }
  );

  @override
  constructor(data: { [key: string]: Any }) {
    super(data);
    if (this.schema_ === null) {
      this.schema_ = functionToSchema(this.function);
    }
  }

  @Field.Validator('function')
  static validateFunction(value: Any): Callable {
    if (typeof value !== 'function') {
      throw new Error('Function must be callable.');
    }
    if (!value.name) {
      throw new Error('Function must have a name.');
    }
    return value;
  }

  @Field.Serializer(
    'function',
    'preProcessor',
    'postProcessor',
    'parser',
    'preProcessorKwargs',
    'postProcessorKwargs'
  )
  static serializeField(value: Any): string | null {
    if (typeof value === 'function') {
      return value.name;
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return null;
  }

  get functionName(): string {
    return this.schema_!['function']['name'];
  }

  @override
  toString(): string {
    const timestampStr = new Date(this.timestamp * 1000).toISOString().slice(0, 16);
    return `${this.className()}(ln_id=${this.ln_id.slice(0, 6)}.., timestamp=${timestampStr}), schema_=${JSON.stringify(this.schema_, null, 4)}`;
  }
}

function funcToTool(
  func_: Callable | Callable[],
  parser: Callable | Callable[] | null = null,
  docstringStyle: Literal<'google', 'rest'> = 'google',
  ...kwargs: Any[]
): Tool[] {
  const funcs = toList(func_);
  const parsers = toList(parser);

  if (parser && funcs.length !== parsers.length) {
    throw new Error('Length of parser must match length of func');
  }

  return funcs.map((func, idx) => new Tool({
    function: func,
    schema_: functionToSchema(func, { style: docstringStyle }),
    parser: parser ? parsers[idx] : null,
    ...kwargs,
  }));
}

export { Tool, funcToTool };
