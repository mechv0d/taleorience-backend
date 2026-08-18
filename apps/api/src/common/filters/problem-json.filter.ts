import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '../errors/domain-error';

interface HttpLikeError {
  statusCode?: number;
  message?: string;
}

@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let messageKey = 'errors.internal';
    let params: Record<string, unknown> | undefined;

    if (exception instanceof DomainError) {
      status = exception.status;
      code = exception.code;
      messageKey = exception.messageKey;
      params = exception.params;

      this.logger.warn(`Domain error: ${code} ${JSON.stringify(params ?? {})}`);
    } else if (exception instanceof NotFoundException) {
      // NestJS выбрасывает NotFoundException для неизвестных маршрутов
      status = 404;
      code = 'NOT_FOUND';
      messageKey = 'errors.notFound';
      params = { path: request.url };

      this.logger.debug(`Not found: ${request.method} ${request.url}`);
    } else if (this.isHttpError(exception)) {
      const httpError = exception as HttpLikeError;
      status = httpError.statusCode ?? 500;

      code = 'HTTP_ERROR';
      messageKey = 'errors.http';
      params = { status };

      this.logger.warn(`HTTP error: ${status} ${request.url}`);
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    void reply
      .status(status)
      .header('content-type', 'application/problem+json')
      .send({
        type: `https://taleorience.dev/errors/${this.toKebab(code)}`,
        code,
        messageKey,
        params,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
  }

  private isHttpError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception
    );
  }

  private toKebab(code: string): string {
    return code.toLowerCase().replace(/_/g, '-');
  }
}
