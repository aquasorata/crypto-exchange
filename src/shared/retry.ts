export async function withTransactionRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 50
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isDeadlock =
      error?.code === 'P2034' || // Prisma transaction conflict
      error?.meta?.code === '40P01' || // PostgreSQL deadlock
      error?.meta?.code === '40001' || // Serialization Failure
      error?.message?.includes('deadlock');

    if (isDeadlock && retries > 0) {
      console.warn(`Deadlock detected. Retrying... (${retries})`);

      // Exponential backoff
      await new Promise(res =>
        setTimeout(res, delay * (4 - retries))
      );

      return withTransactionRetry(fn, retries - 1, delay);
    }

    throw error;
  }
}