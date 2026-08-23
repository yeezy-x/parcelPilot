const POSITIVE_CONFIRMATIONS = new Set([
    "yes",
    "yes please",
    "confirm",
    "confirmed",
    "do it",
    "go ahead",
    "create it",
    "proceed",
  ]);
  
  const NEGATIVE_CONFIRMATIONS = new Set([
    "no",
    "no thanks",
    "cancel",
    "don't",
    "do not",
    "stop",
  ]);
  
  export function isConfirmation(message: string): boolean {
    return POSITIVE_CONFIRMATIONS.has(
      message.trim().toLowerCase(),
    );
  }
  
  export function isRejection(message: string): boolean {
    return NEGATIVE_CONFIRMATIONS.has(
      message.trim().toLowerCase(),
    );
  }