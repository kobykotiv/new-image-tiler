export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    onProgress?.(Math.min(i + batchSize, items.length), items.length);
    // Allow UI to update between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}
