# Stream Handler 구현 가이드

SSE(Server-Sent Events) 스트리밍 응답을 처리하는 방법을 설명합니다.

## 1. Stream Handler 구현

생성된 `ReadableStreamHandler`를 상속받아 커스텀 핸들러를 구현합니다.

### 기본 구조

```typescript
import type { YourResponseDto } from '@/shared/api/__generated__/dto';
import { ReadableStreamHandler, StreamHandlerError } from '@/shared/api/__generated__/stream-utils';
import { isYourResponseDto } from '@/shared/api/__generated__/type-guards';

/**
 * 스트림 이벤트별 콜백 타입
 */
export type YourStreamCallbacks = {
  message_start?: (data: YourResponseDto) => void;
  message_delta?: (data: { text: string }) => void;
  message_end?: (data: YourResponseDto) => void;
  error?: (error: StreamHandlerError | unknown) => void;
};

/**
 * 커스텀 Stream Handler
 */
export class YourStreamHandler extends ReadableStreamHandler {
  constructor(response: Response, callbacks: YourStreamCallbacks) {
    super(response, {
      message_start: (data) => {
        if (isYourResponseDto(data)) {
          callbacks.message_start?.(data);
        }
      },
      message_delta: (data) => {
        // 필요한 경우 타입 가드 추가
        callbacks.message_delta?.(data);
      },
      message_end: (data) => {
        if (isYourResponseDto(data)) {
          callbacks.message_end?.(data);
        }
      },
      error: (error) => {
        if (error instanceof StreamHandlerError) {
          callbacks.error?.({ type: 'stream-handler-error', ...error });
          return;
        }
        callbacks.error?.(error);
      },
    });
  }
}
```

## 2. 주요 포인트

### 타입 가드 활용

생성된 타입 가드를 사용하여 런타임 데이터 검증:

```typescript
import { isYourResponseDto } from '@/shared/api/__generated__/type-guards';

message_start: (data) => {
  // 타입 검증 후 안전하게 사용
  if (isYourResponseDto(data)) {
    callbacks.message_start?.(data);
  }
}
```

### 에러 처리

두 가지 유형의 에러를 구분:

- **StreamHandlerError**: 핸들러 내부에서 발생한 에러
- **일반 에러**: 네트워크, 파싱 등의 예상치 못한 에러

```typescript
error: (error) => {
  if (error instanceof StreamHandlerError) {
    // 핸들러 에러 처리
    callbacks.error?.({ type: 'stream-handler-error', ...error });
    return;
  }
  // 일반 에러 처리
  callbacks.error?.(error);
}
```

## 3. 사용 예제

```typescript
// API 호출
yourApi.streamingEndpoint({
  param1: 'value',
  callbacks: {
    message_start: (data) => {
      console.log('스트림 시작:', data);
    },
    message_delta: (data) => {
      console.log('증분 데이터:', data.text);
    },
    message_end: (data) => {
      console.log('스트림 완료:', data);
    },
    error: (error) => {
      console.error('에러 발생:', error);
    },
  },
});
```

## 참고 자료

- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Streams API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
