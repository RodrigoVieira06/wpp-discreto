import type { Readable, Writable } from 'node:stream';

interface PendingCommand {
  resolve: (result: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Chrome's pipe protocol uses UTF-8 JSON messages separated by a null byte. */
export class PipeClient {
  private output: Writable;
  private sequence = 0;
  private buffer = '';
  private pending = new Map<number, PendingCommand>();
  private closed = false;

  constructor(output: Writable, input: Readable) {
    this.output = output;
    input.setEncoding('utf8');
    input.on('data', (chunk: string) => {
      this.buffer += chunk;
      let end = this.buffer.indexOf('\0');
      while (end !== -1) {
        const message = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 1);
        try {
          this.receive(JSON.parse(message));
        } catch {
          this.fail(new Error('Chrome sent an invalid protocol message.'));
        }
        end = this.buffer.indexOf('\0');
      }
    });
    input.on('close', () =>
      this.fail(
        new Error(
          'Chrome debugging pipe closed. Close any existing local test session and try again.',
        ),
      ),
    );
    input.on('error', (error) => this.fail(error));
    output.on('error', (error) => this.fail(error));
  }

  send<T = Record<string, unknown>>(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
  ): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Chrome debugging pipe is closed.'));
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Chrome command timed out: ${method}`));
      }, 10000);
      this.pending.set(id, { resolve: (value) => resolve(value as T), reject, timer });
      this.output.write(
        `${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`,
      );
    });
  }

  private receive(message: {
    id?: number;
    result?: Record<string, unknown>;
    error?: { message: string };
  }) {
    if (message.id === undefined) return;
    const command = this.pending.get(message.id);
    if (!command) return;
    this.pending.delete(message.id);
    clearTimeout(command.timer);
    if (message.error) command.reject(new Error(message.error.message));
    else command.resolve(message.result ?? {});
  }

  private fail(error: Error) {
    this.closed = true;
    for (const command of this.pending.values()) {
      clearTimeout(command.timer);
      command.reject(error);
    }
    this.pending.clear();
  }
}
