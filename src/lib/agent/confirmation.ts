export type PendingConfirmation = {
    toolName: "createEscalation";
    arguments: Record<string, unknown>;
  };
  
  let pendingConfirmation: PendingConfirmation | null = null;
  
  export function setPendingConfirmation(
    confirmation: PendingConfirmation,
  ) {
    pendingConfirmation = confirmation;
  }
  
  export function getPendingConfirmation() {
    return pendingConfirmation;
  }
  
  export function clearPendingConfirmation() {
    pendingConfirmation = null;
  }