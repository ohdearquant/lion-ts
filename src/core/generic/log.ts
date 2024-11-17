import { Any, Field, Note, PrivateAttr } from 'lion/core/typing';
import { toDict } from 'lion/libs/parse';
import { Element } from './element';

export class Log extends Element {
  content: Note = Field({
    defaultFactory: () => new Note(),
    title: 'Log Content',
    description: 'The content of the log entry.',
  });

  loginfo: Note = Field({
    defaultFactory: () => new Note(),
    title: 'Log Info',
    description: 'Metadata about the log entry.',
  });

  private _immutable: boolean = PrivateAttr(false);

  constructor(content: Note, loginfo: Note, ...kwargs: any[]) {
    super(kwargs);
    this.content = this._validateNote(content);
    this.loginfo = this._validateNote(loginfo);
  }

  static _validateLoadData(data: Record<string, any>): Record<string, any> {
    try {
      if (typeof data.content !== 'object' || !(data.content instanceof Note)) {
        throw new Error("Missing or invalid 'content' field");
      }
      if (typeof data.loginfo !== 'object' || !(data.loginfo instanceof Note)) {
        throw new Error("Missing or invalid 'loginfo' field");
      }

      if ('log_id' in data) {
        data.ln_id = data.log_id;
        delete data.log_id;
      }
      if ('log_timestamp' in data) {
        data.timestamp = data.log_timestamp;
        delete data.log_timestamp;
      }
      if ('log_class' in data) {
        data.lion_class = data.log_class;
        delete data.log_class;
      }
      return data;
    } catch (e) {
      throw new Error('Log can only be loaded from a previously saved log entries.');
    }
  }

  static fromDict(data: Record<string, any>): Log {
    data = this._validateLoadData(data);
    if (typeof data.content === 'object') {
      data.content = new Note(data.content);
    }
    if (typeof data.loginfo === 'object') {
      data.loginfo = new Note(data.loginfo);
    }
    delete data.lion_class;
    const log = new this(data.content, data.loginfo, data);
    log._immutable = true;
    return log;
  }

  __setattr__(name: string, value: any): void {
    if (this._immutable) {
      throw new Error('Cannot modify immutable log entry.');
    }
    super.__setattr__(name, value);
  }

  _validateNote(value: any): Note {
    if (!value) {
      return new Note();
    }
    if (value instanceof Note) {
      return value;
    }
    if (typeof value === 'object') {
      return new Note(value);
    }
    try {
      return new Note(toDict(value));
    } catch (e) {
      throw new Error(`Invalid note value: ${value}`);
    }
  }

  @Field.Serializer('content', 'loginfo')
  _serializeNote(value: Note): Record<string, any> {
    return value.toDict();
  }

  toDict(): Record<string, any> {
    const dict = super.toDict();
    dict.log_id = dict.ln_id;
    delete dict.ln_id;
    dict.log_class = dict.lion_class;
    delete dict.lion_class;
    dict.log_timestamp = dict.timestamp;
    delete dict.timestamp;

    return toDict(dict, {
      recursive: true,
      recursivePythonOnly: false,
      maxRecursiveDepth: 10,
    });
  }

  toNote(): Note {
    return new Note(this.toDict());
  }
}
