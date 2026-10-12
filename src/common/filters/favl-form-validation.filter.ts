import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MAX_IMAGE_BYTES } from '../upload/image-upload';

interface FormConfig {
  basePath: string;
  createTitle: string;
  editTitle: string;
  formView: string;
  creating?: boolean;
  hideTerms?: boolean;
}

@Catch(BadRequestException, PayloadTooLargeException, ConflictException)
export class FavlFormValidationFilter implements ExceptionFilter {
  constructor(private readonly config: FormConfig) {}

  catch(
    exception: BadRequestException | PayloadTooLargeException | ConflictException,
    host: ArgumentsHost,
  ) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const id = request.params.id;
    const details = exception.getResponse();
    const message =
      exception instanceof PayloadTooLargeException
        ? `La imagen supera el máximo de ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`
        : typeof details === 'object' &&
      details !== null &&
      'message' in details &&
      Array.isArray(details.message)
        ? details.message.join(' ')
        : exception.message;

    return response.status(exception.getStatus()).render(this.config.formView, {
      titulo: id || this.config.creating === false ? this.config.editTitle : this.config.createTitle,
      basePath: this.config.basePath,
      action: id ? `${this.config.basePath}/${id}` : this.config.basePath,
      registro: { ...request.body, ...(id ? { id } : {}) },
      creating: this.config.creating ?? !id,
      hideTerms: this.config.hideTerms ?? false,
      error: message,
    });
  }
}
