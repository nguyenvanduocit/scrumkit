/**
 * Check if an error indicates the room is full
 */
export function isRoomFullError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('maxClients') || error.message.includes('full')
  }
  return false
}
