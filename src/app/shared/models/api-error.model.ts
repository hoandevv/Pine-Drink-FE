import { FieldError } from './field-error.model';

export interface ApiError {
  success?: boolean;
  status: number;
  errorCode?: string;
  message?: string;
  fieldErrors?: FieldError[];
  errors?: FieldError[];
  retryAfter?: number;
  traceId?: string;
  timestamp?: string;
}
