/**
 * 流式 HTTP 请求工具
 * 使用 fetch + ReadableStream 实现流式数据传输
 */

export interface StreamOptions<T> {
  // 请求 URL
  url: string;
  // 请求体
  body?: Record<string, unknown>;
  // 请求头
  headers?: Record<string, string>;
  // 收到数据块时的回调
  onChunk: (chunk: T) => void;
  // 请求完成时的回调
  onComplete?: () => void;
  // 请求出错时的回调
  onError?: (error: Error) => void;
  // AbortController 用于取消请求
  signal?: AbortSignal;
}

/**
 * 发起流式 HTTP 请求
 * 支持 NDJSON 格式（每行一个 JSON 对象）
 */
export async function streamRequest<T = unknown>(options: StreamOptions<T>): Promise<void> {
  const { url, body, headers = {}, onChunk, onComplete, onError, signal } = options;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 处理缓冲区中剩余的数据
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer) as T;
            onChunk(chunk);
          } catch {
            console.warn('解析最后一块数据失败:', buffer);
          }
        }
        break;
      }

      // 解码并追加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按行分割处理 NDJSON
      const lines = buffer.split('\n');
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as T;
          onChunk(chunk);
        } catch {
          console.warn('解析数据块失败:', trimmed);
        }
      }
    }

    onComplete?.();
  } catch (error) {
    // 忽略用户主动取消的请求
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 创建可取消的流式请求
 * 返回 AbortController 用于取消请求
 */
export function createStreamRequest<T = unknown>(
  options: Omit<StreamOptions<T>, 'signal'>
): { abort: () => void; promise: Promise<void> } {
  const controller = new AbortController();

  const promise = streamRequest<T>({
    ...options,
    signal: controller.signal,
  });

  return {
    abort: () => controller.abort(),
    promise,
  };
}
