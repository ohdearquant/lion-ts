import * as atexit from 'atexit';
import * as logging from 'logging';
import { Path } from 'path';
import { createPath } from 'lion/libs/file';
import { LogConfig } from 'lion/protocols/configs/log_config';
import { Log } from './log';
import { Pile } from './pile';

export class LogManager {
  logs: Pile<Log>;
  persistDir: string | Path | null;
  subfolder: string | null;
  filePrefix: string | null;
  capacity: number | null;
  extension: string;
  useTimestamp: boolean;
  hashDigits: number;
  clearAfterDump: boolean;

  constructor(
    logs: any = null,
    persistDir: string | Path | null = null,
    subfolder: string | null = null,
    filePrefix: string | null = null,
    capacity: number | null = null,
    extension: string = '.csv',
    useTimestamp: boolean = true,
    hashDigits: number = 5,
    autoSaveOnExit: boolean = true,
    clearAfterDump: boolean = true
  ) {
    this.logs = new Pile(logs || {}, { itemType: Log });
    this.persistDir = persistDir;
    this.subfolder = subfolder;
    this.filePrefix = filePrefix;
    this.capacity = capacity;
    this.extension = extension;
    this.useTimestamp = useTimestamp;
    this.hashDigits = hashDigits;
    this.clearAfterDump = clearAfterDump;

    if (autoSaveOnExit) {
      atexit.register(this.saveAtExit.bind(this));
    }
  }

  async alog(log_: Log): Promise<void> {
    await this.logs.lock(async () => {
      this.log(log_);
    });
  }

  log(log_: Log): void {
    if (this.capacity && this.logs.size() >= this.capacity) {
      try {
        this.dump(this.clearAfterDump);
      } catch (e) {
        logging.error(`Failed to auto-dump logs: ${e}`);
      }
    }
    this.logs.include(log_);
  }

  async adump(clear: boolean | null = null, persistPath: string | Path = null): Promise<void> {
    await this.logs.lock(async () => {
      this.dump(clear === null ? this.clearAfterDump : clear, persistPath);
    });
  }

  dump(clear: boolean | null = null, persistPath: string | Path = null): void {
    if (this.logs.isEmpty()) {
      logging.debug('No logs to dump');
      return;
    }

    try {
      const fp = persistPath || this._createPath();
      this.logs.toCsv(fp);
      logging.info(`Successfully dumped logs to ${fp}`);

      if (clear === null ? this.clearAfterDump : clear) {
        this.logs.clear();
      }
    } catch (e) {
      logging.error(`Failed to dump logs: ${e}`);
      throw e;
    }
  }

  _createPath(): Path {
    const persistPath = this.persistDir || './data/logs';
    const dir = this.subfolder ? `${persistPath}/${this.subfolder}` : persistPath;
    return createPath({
      directory: dir,
      filename: this.filePrefix || '',
      extension: this.extension,
      timestamp: this.useTimestamp,
      randomHashDigits: this.hashDigits,
    });
  }

  saveAtExit(): void {
    if (!this.logs.isEmpty()) {
      try {
        this.dump(this.clearAfterDump);
      } catch (e) {
        logging.error(`Failed to save logs on exit: ${e}`);
      }
    }
  }

  static fromConfig(config: LogConfig, logs: any = null): LogManager {
    return new LogManager(
      logs,
      config.persistDir,
      config.subfolder,
      config.filePrefix,
      config.capacity,
      config.extension,
      config.useTimestamp,
      config.hashDigits,
      config.autoSaveOnExit,
      config.clearAfterDump
    );
  }
}
