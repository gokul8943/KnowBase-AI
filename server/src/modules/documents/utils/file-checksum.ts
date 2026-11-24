import { createHash } from 'crypto';
import { readFileSync } from 'fs';

export const calculateChecksum = (filePath: string, algorithm: 'sha256' | 'md5' = 'sha256'): string => {
  const buffer = readFileSync(filePath);
  const hash = createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
};

export const calculateStreamChecksum = (stream: NodeJS.ReadableStream, algorithm: 'sha256' | 'md5' = 'sha256'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

export const verifyChecksum = (filePath: string, expectedChecksum: string, algorithm: 'sha256' | 'md5' = 'sha256'): boolean => {
  const actualChecksum = calculateChecksum(filePath, algorithm);
  return actualChecksum === expectedChecksum;
};