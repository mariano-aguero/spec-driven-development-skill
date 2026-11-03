export async function findUser(_email: string): Promise<{ id: string; passwordHash: string } | null> {
  throw new Error('storage is not part of this fixture')
}

export async function countRecentFailures(_email: string, _minutes: number): Promise<number> {
  throw new Error('storage is not part of this fixture')
}

export async function recordFailure(_email: string): Promise<void> {
  throw new Error('storage is not part of this fixture')
}
