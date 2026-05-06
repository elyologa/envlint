import { run } from './runner';
import * as loader from '../schema/loader';
import * as validator from '../schema/validator';
import * as reporter from '../reporter/reporter';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('../schema/loader');
jest.mock('../schema/validator');
jest.mock('../reporter/reporter');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLoader = loader as jest.Mocked<typeof loader>;
const mockValidator = validator as jest.Mocked<typeof validator>;
const mockReporter = reporter as jest.Mocked<typeof reporter>;

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockLoader.loadSchema.mockReturnValue({ fields: {} });
    mockLoader.loadEnvFile.mockReturnValue({ PORT: '3000' });
    mockValidator.validate.mockReturnValue([]);
    mockReporter.generateReport.mockReturnValue({ file: '.env', errors: [], errorCount: 0 });
    mockReporter.formatReport.mockReturnValue('✔ .env — no issues found');
  });

  it('returns success when no errors', () => {
    const result = run({ schemaPath: '.envschema.json', envPaths: ['.env'] });
    expect(result.success).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('returns failure when errors exist', () => {
    mockValidator.validate.mockReturnValue([{ key: 'PORT', message: 'missing' }] as any);
    mockReporter.generateReport.mockReturnValue({ file: '.env', errors: [{ key: 'PORT', message: 'missing' }], errorCount: 1 });
    const result = run({ schemaPath: '.envschema.json', envPaths: ['.env'] });
    expect(result.success).toBe(false);
    expect(result.errorCount).toBe(1);
  });

  it('outputs JSON when format is json', () => {
    const result = run({ schemaPath: '.envschema.json', envPaths: ['.env'], format: 'json' });
    expect(() => JSON.parse(result.output)).not.toThrow();
  });

  it('throws if schema file does not exist', () => {
    mockFs.existsSync.mockReturnValueOnce(false);
    expect(() => run({ schemaPath: 'missing.json', envPaths: ['.env'] })).toThrow('Schema file not found');
  });

  it('throws if env file does not exist', () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(() => run({ schemaPath: '.envschema.json', envPaths: ['.env.missing'] })).toThrow('Env file not found');
  });
});
