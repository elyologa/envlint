export type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'email';

export interface EnvVarSchema {
  type: EnvVarType;
  required?: boolean;
  default?: string;
  description?: string;
  pattern?: string;
}

export interface EnvSchema {
  [key: string]: EnvVarSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
  type: 'missing' | 'type_mismatch' | 'pattern_mismatch';
}

export interface ValidationWarning {
  key: string;
  message: string;
  type: 'extra_key' | 'using_default';
}
