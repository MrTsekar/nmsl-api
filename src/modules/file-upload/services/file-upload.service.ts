import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FileUploadService {
  private s3: AWS.S3;
  private readonly bucket: string;
  private readonly enabled: boolean;
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'nmsl-medical-files';
    this.enabled = !!accessKeyId && !accessKeyId.startsWith('your_');

    if (this.enabled) {
      this.s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      });
    } else {
      this.logger.warn('AWS S3 not configured. File uploads will return mock URLs.');
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
      const mockUrl = `https://mock-s3.nmsl.com/${folder}/${Date.now()}_${file.originalname}`;
      this.logger.log(`[S3 MOCK] Uploaded: ${mockUrl}`);
      return mockUrl;
    }

    const key = `${folder}/${Date.now()}_${file.originalname}`;
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async getSignedUrl(key: string): Promise<string> {
    if (!this.enabled) return key;
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: 3600,
    });
  }
}
