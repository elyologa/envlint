import type {
  EnvSchema,
  EnvVarSchema,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types';

const TYPE_PATTERNS: Record<string, RegExp> = {
  number: /^-?\d+(\.\d+)?$/,
  boolean: /^(true|false|1|0)$/i,
  url: /^https?:\/\/.+/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

function validateValue(key: string, value: string, schema: EnvVarSchema): ValidationError | null {
  if (schema.type !== 'string' && TYPE_PATTERNS[schema.type]) {
    if (!TYPE_PATTERNS[schema.type].test(value)) {
      return {
        key,
        message: `Expected type '${schema.type}' but got value '${value}'`,
        type: 'type_mismatch',
      };
    }
  }

  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      return {
        key,
        message: `Value '${value}' does not match pattern '${schema.pattern}'`,
        type: 'pattern_mismatch',
      };
    }
  }

  return null;
}

export function validate(
  env: Record<string, string>,
  schema: EnvSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [key, varSchema] of Object.entries(schema)) {
    const value = env[key];

    if (value === undefined || value === '') {
      if (varSchema.required !== false && varSchema.default === undefined) {
        errors.push({ key, message: `Missing required variable '${key}'`, type: 'missing' });
      } else if (varSchema.default !== undefined) {
        warnings.push({ key, message: `Using default value for '${key}'`, type: 'using_default' });
      }
      continue;
    }

    const typeError = validateValue(key, value, varSchema);
    if (typeError) errors.push(typeError);
  }

  for (const key of Object.keys(env)) {
    if (!schema[key]) {
      warnings.push({ key, message: `Undeclared variable '${key}' found in env`, type: 'extra_key' });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
