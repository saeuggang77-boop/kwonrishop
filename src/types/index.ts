export type ApiResponse<T> = {
  data: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
};

export type ApiError = {
  error: {
    message: string;
    code: string;
    errors?: Record<string, string[]>;
  };
};

export type ReportMeta = {
  dataSources: string[];
  modelAssumptions: string[];
  modelVersion: string;
  generatedAt: string;
  legalDisclaimer: string;
};
