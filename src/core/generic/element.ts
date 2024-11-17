/** Base element module for the Lion framework. */

import { DateTime } from 'luxon';
import { fieldValidator } from 'pydantic';
import { override } from 'typing-extensions';
import { LION_CLASS_REGISTRY, getClass } from 'lion/core/_class_registry';
import {
  ID,
  Any,
  BaseModel,
  ConfigDict,
  Field,
  IDError,
  LnID,
  Observable,
  TypeVar,
} from 'lion/core/typing';
import { time } from 'lion/libs/utils';
import { Settings } from 'lion/settings';

const T = TypeVar('T', Observable);

export class Element extends BaseModel implements Observable {
  ln_id: LnID = Field({
    defaultFactory: () => ID.id(),
    title: 'Lion ID',
    description: 'Unique identifier for the element',
    frozen: true,
  });

  timestamp: number = Field({
    defaultFactory: () => time('timestamp'),
    title: 'Creation Timestamp',
    frozen: true,
    alias: 'created',
  });

  static modelConfig = ConfigDict({
    extra: 'forbid',
    arbitraryTypesAllowed: true,
    useEnumValues: true,
    populateByName: true,
  });

  static className(): string {
    return this.name;
  }

  static __pydantic_init_subclass__(cls: typeof Element, kwargs: Any): void {
    super.__pydantic_init_subclass__(kwargs);
    LION_CLASS_REGISTRY[cls.name] = cls;
  }

  get createdDatetime(): DateTime {
    return DateTime.fromSeconds(this.timestamp, { zone: Settings.Config.TIMEZONE });
  }

  @fieldValidator('ln_id', { mode: 'before' })
  static _validate_id(value: ID.ID): string {
    try {
      return ID.get_id(value);
    } catch {
      throw new IDError(`Invalid lion id: ${value}`);
    }
  }

  @fieldValidator('timestamp', { mode: 'before' })
  static _validate_timestamp(value: Any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (value instanceof DateTime) {
      return value.toSeconds();
    }
    try {
      if (typeof value === 'string') {
        return parseFloat(value) || DateTime.fromISO(value).toSeconds();
      }
      throw new Error();
    } catch {
      throw new Error(`Invalid datetime string format: ${value}`);
    }
  }

  @override
  static fromDict(cls: typeof Element, data: Record<string, Any>, kwargs: Any): T {
    if ('lion_class' in data) {
      cls = getClass(data['lion_class']);
      delete data['lion_class'];
    }
    return cls.modelValidate(data, kwargs);
  }

  @override
  toDict(kwargs: Any): Record<string, Any> {
    const dict = this.modelDump(kwargs);
    dict['lion_class'] = this.className();
    return dict;
  }

  @override
  toString(): string {
    const timestampStr = this.createdDatetime.toISO({ suppressMilliseconds: true });
    return `${this.className()}(ln_id=${this.ln_id.slice(0, 6)}.., timestamp=${timestampStr})`;
  }

  toRepr(): string {
    return this.toString();
  }

  __hash__(): number {
    return this.ln_id.hashCode();
  }

  __bool__(): boolean {
    return true;
  }

  __len__(): number {
    return 1;
  }
}
