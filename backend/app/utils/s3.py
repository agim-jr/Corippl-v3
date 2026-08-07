import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.config import settings
import logging
from typing import Optional
import mimetypes

logger = logging.getLogger(__name__)

class S3Manager:
    """Handles all S3 operations for file uploads"""

    def __init__(self):
        """Initialize S3 client with credentials from settings"""
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION
            )
            self.bucket_name = settings.AWS_S3_BUCKET_NAME
            logger.info(f"S3Manager initialized for bucket: {self.bucket_name}")
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise
        except Exception as e:
            logger.error(f"Error initializing S3Manager: {str(e)}")
            raise

    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload a file to S3 bucket

        Args:
            file_content: The file content as bytes
            file_name: The name/path for the file in S3
            content_type: MIME type of the file (auto-detected if not provided)

        Returns:
            The public URL of the uploaded file, or None if upload failed
        """
        try:
            # Auto-detect content type if not provided
            if not content_type:
                content_type, _ = mimetypes.guess_type(file_name)
                content_type = content_type or 'application/octet-stream'

            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'  # Make file publicly accessible
            )

            # Construct the public URL
            file_url = f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{file_name}"
            logger.info(f"File uploaded successfully: {file_url}")
            return file_url

        except ClientError as e:
            logger.error(f"Error uploading file to S3: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading file: {str(e)}")
            return None

    def delete_file(self, file_name: str) -> bool:
        """
        Delete a file from S3 bucket

        Args:
            file_name: The name/path of the file in S3

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_name
            )
            logger.info(f"File deleted successfully: {file_name}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting file from S3: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting file: {str(e)}")
            return False

    def generate_presigned_url(self, file_name: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for temporary access to a private file

        Args:
            file_name: The name/path of the file in S3
            expiration: Time in seconds for the URL to remain valid (default: 1 hour)

        Returns:
            A presigned URL, or None if generation failed
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_name
                },
                ExpiresIn=expiration
            )
            logger.info(f"Presigned URL generated for: {file_name}")
            return url

        except ClientError as e:
            logger.error(f"Error generating presigned URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {str(e)}")
            return None

    def file_exists(self, file_name: str) -> bool:
        """
        Check if a file exists in S3 bucket

        Args:
            file_name: The name/path of the file in S3

        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_name
            )
            return True
        except ClientError:
            return False


# Create a singleton instance
s3_manager = S3Manager()
