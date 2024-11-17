import * as path from 'path';
import { getClassFileRegistry, getClassObjects } from 'lion/libs/utils';

type ClassType<T> = new (...args: any[]) => T;

interface ClassRegistry<T> {
  [key: string]: ClassType<T>;
}

interface ClassFileRegistry {
  [key: string]: string;
}

const LION_CLASS_REGISTRY: ClassRegistry<any> = {};
let LION_CLASS_FILE_REGISTRY: ClassFileRegistry = {};

const patternList = [
  'lion/core/generic',
  'lion/core/communication',
  'lion/core/action',
  'lion/core/session',
  'lion/core/forms',
];

if (Object.keys(LION_CLASS_FILE_REGISTRY).length === 0) {
  const scriptPath = path.resolve(__filename);
  const scriptDir = path.dirname(scriptPath);

  LION_CLASS_FILE_REGISTRY = getClassFileRegistry(scriptDir, patternList);
}

export function getClass<T>(className: string): ClassType<T> {
  if (LION_CLASS_REGISTRY[className]) {
    return LION_CLASS_REGISTRY[className];
  }

  try {
    const foundClassFilepath = LION_CLASS_FILE_REGISTRY[className];
    const foundClassDict = getClassObjects(foundClassFilepath);
    return foundClassDict[className];
  } catch (e) {
    throw new Error(`Unable to find class ${className}: ${e}`);
  }
}
