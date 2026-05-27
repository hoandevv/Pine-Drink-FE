import { FieldError } from './field-error.model';

export interface ApiError {
  status: number;
  errorCode?: string;
  message: string;
  fieldErrors?: FieldError[];
}
