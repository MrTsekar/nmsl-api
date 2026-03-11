import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FileUploadService {
  private blobServiceClient: BlobServiceClient;
  private readonly container: string;
  private readonly enabled: boolean;
  private readonly accountName: string;
  private readonly accountKey: string;
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    this.container =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER') || 'nmsl-medical-files';
    this.enabled = !!connectionString && !connectionString.startsWith('your_');

    if (this.enabled) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const nameMatch = connectionString.match(/AccountName=([^;]+)/);
      const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
      this.accountName = nameMatch ? nameMatch[1] : '';
      this.accountKey = keyMatch ? keyMatch[1] : '';
    } else {
      this.logger.warn('Azure Blob Storage not configured. File uploads will return mock URLs.');
    }
  }

  validateFile(file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, PNG, JPG allowed.');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 10MB limit.');
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    this.validateFile(file);

    if (!this.enabled) {
      const mockUrl = `https://mock-azure.nmsl.com/${this.container}/${folder}/${Date.now()}_${file.originalname}`;
      this.logger.log(`[AZURE MOCK] Uploaded: ${mockUrl}`);
      return mockUrl;
    }

    const blobName = `${folder}/${Date.now()}_${file.originalname}`;
    const containerClient = this.blobServiceClient.getContainerClient(this.container);
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url;
  }

  async getSignedUrl(blobUrl: string): Promise<string> {
    if (!this.enabled) return blobUrl;

    const urlObj = new URL(blobUrl);
    const blobName = urlObj.pathname.replace(`/${this.container}/`, '');

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey,
    );

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    return `${blobUrl}?${sasToken}`;
  }
}
