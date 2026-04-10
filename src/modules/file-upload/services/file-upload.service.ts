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

  /**
   * Upload a base64 encoded image to Azure Blob Storage
   * @param base64Data - Base64 string (can include data URL prefix like "data:image/png;base64,...")
   * @param folder - Folder path in blob storage (e.g., 'services/banners')
   * @param filename - File name (without extension, will be generated)
   * @returns URL of uploaded file
   */
  async uploadBase64Image(base64Data: string, folder: string, filename?: string): Promise<string> {
    if (!base64Data) {
      throw new BadRequestException('No image data provided');
    }

    try {
      // Extract mime type and base64 content
      let mimeType = 'image/png'; // default
      let base64Content = base64Data;

      // Handle data URL format: data:image/png;base64,iVBORw0KG...
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Content = matches[2];
        }
      }

      // Validate mime type
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(mimeType)) {
        throw new BadRequestException(`Invalid image type: ${mimeType}. Only PNG, JPEG, WEBP, GIF allowed.`);
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Content, 'base64');

      // Validate size (10MB limit)
      if (buffer.length > MAX_SIZE_BYTES) {
        throw new BadRequestException(`Image size exceeds 10MB limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
      }

      // Generate filename
      const extension = mimeType.split('/')[1];
      const blobName = `${folder}/${filename || Date.now()}.${extension}`;

      this.logger.log(`📤 Uploading base64 image: ${blobName} (${(buffer.length / 1024).toFixed(2)}KB)`);

      // Mock upload if not configured
      if (!this.enabled) {
        const mockUrl = `https://mock-azure.nmsl.com/${this.container}/${blobName}`;
        this.logger.log(`[AZURE MOCK] Uploaded: ${mockUrl}`);
        return mockUrl;
      }

      // Upload to Azure
      const containerClient = this.blobServiceClient.getContainerClient(this.container);
      await containerClient.createIfNotExists({ access: 'blob' }); // public read access

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { 
          blobContentType: mimeType,
          blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
      });

      this.logger.log(`✅ Uploaded: ${blockBlobClient.url}`);
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error(`Failed to upload base64 image: ${error.message}`, error.stack);
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }
}
