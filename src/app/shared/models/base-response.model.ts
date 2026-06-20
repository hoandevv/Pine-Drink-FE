import { FieldError } from './field-error.model';

export interface BaseResponse<T> {
  success: boolean;
  errorCode?: string | null;
  message: string;
  data: T;
  fieldErrors?: FieldError[];
  timestamp: string;
}
