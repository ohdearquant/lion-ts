import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix: string = ''): string => {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
};

export const generateMessageId = (): string => generateId('msg');
export const generateActionId = (): string => generateId('act');
export const generateBranchId = (): string => generateId('branch');
export const generateStepId = (): string => generateId('step');
