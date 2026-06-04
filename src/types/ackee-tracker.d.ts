declare module "ackee-tracker" {
  export interface TrackerInstance {
    record(
      domainId: string,
      attributes?: Record<string, unknown>,
      callback?: (recordId: string) => void
    ): { stop: () => void };
    action(
      eventId: string,
      attributes: { key: string; value?: number | null },
      callback?: (actionId: string) => void
    ): void;
    updateRecord(recordId: string): { stop: () => void };
    updateAction(
      actionId: string,
      attributes: { key: string; value?: number | null }
    ): void;
  }

  export function create(
    server: string,
    options?: {
      detailed?: boolean;
      ignoreLocalhost?: boolean;
      ignoreOwnVisits?: boolean;
    }
  ): TrackerInstance;

  export function attributes(detailed?: boolean): Record<string, unknown>;
  export function detect(): void;
}
