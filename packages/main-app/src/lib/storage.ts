import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import AWS from 'aws-sdk';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Storage interface
interface StorageProvider {
  uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string>;
}

// Local storage implementation
class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    // Store files in the public/uploads directory
    this.uploadDir = join(process.cwd(), 'public', 'uploads');
  }

  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    // Ensure upload directory exists
    await mkdir(this.uploadDir, { recursive: true });
    
    // Write file to local filesystem
    const filePath = join(this.uploadDir, fileName);
    await writeFile(filePath, file);

    // Return the URL that can be used to access the file
    return `/uploads/${fileName}`;
  }
}

// S3 storage implementation
class S3StorageProvider implements StorageProvider {
  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const uploadResult = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${fileName}`,
      Body: file,
      ContentType: contentType,
    }).promise();

    return uploadResult.Location;
  }
}

// Export the appropriate storage provider based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
export const storageProvider: StorageProvider = isDevelopment 
  ? new LocalStorageProvider() 
  : new S3StorageProvider(); 