let traceEnabled = false;

export function setTrace(enabled: boolean): void {
  traceEnabled = enabled;
}

export function isTraceEnabled(): boolean {
  return traceEnabled;
}

export function trace(label: string, data: unknown): void {
  if (traceEnabled) {
    console.error(`[TRACE] ${label}:`, JSON.stringify(data, null, 2));
  }
}
