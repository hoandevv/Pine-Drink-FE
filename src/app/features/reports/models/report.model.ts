export type ReportType = 'INVOICE' | 'DAILY_REVENUE' | 'PRODUCT_CATALOG' | string;
export type ReportFileFormat = 'PDF' | 'XLSX' | string;
export type ReportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | string;

export interface CreateReportJobRequest {
  reportType: ReportType;
  fileFormat: ReportFileFormat;
  filters?: string | null;
  branchId?: string | null;
}

export interface ReportJobResponse {
  id: string;
  reportType: ReportType;
  fileFormat: ReportFileFormat;
  status: ReportJobStatus;
  fileUrl?: string | null;
  errorMessage?: string | null;
  requestedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}
