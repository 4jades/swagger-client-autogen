# TanStack Query와 Stream 통합 가이드

스트리밍 API를 TanStack Query mutation과 함께 사용하는 방법을 설명합니다.

## 기본 패턴

### 1. Mutation Hook 구현

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { YourRequestDto, YourResponseDto } from '@/shared/api/__generated__/dto';
import { yourApi } from '@/entities/your-module/__generated__/api/instance';
import { YOUR_MUTATION_KEY } from '@/entities/your-module/__generated__/api/mutations';
import { YOUR_QUERY_KEY } from '@/entities/your-module/__generated__/api/queries';

type StreamMutationParams = {
  id: number;
  payload: YourRequestDto;
  callbacks?: {
    message_start?: (data: YourResponseDto) => void;
    message_delta?: (data: { text: string }) => void;
    message_end?: (data: YourResponseDto) => void;
    error?: (error: unknown) => void;
  };
};

export function useYourStreamMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, payload, callbacks }: StreamMutationParams) => {
      return new Promise<void>((resolve, reject) => {
        yourApi.streamingEndpoint({
          id,
          payload,
          callbacks: {
            message_start: (data) => {
              // 캐시에 초기 데이터 설정
              queryClient.setQueryData(
                YOUR_QUERY_KEY.GET_YOUR_ENDPOINT(id),
                (old: YourResponseDto[] = []) => [...old, data]
              );
              callbacks?.message_start?.(data);
            },
            message_delta: (data) => {
              // 증분 데이터로 캐시 업데이트
              queryClient.setQueryData(
                YOUR_QUERY_KEY.GET_YOUR_ENDPOINT(id),
                (old: YourResponseDto[] = []) => {
                  const lastItem = old[old.length - 1];
                  if (!lastItem) return old;

                  // 마지막 항목의 텍스트 업데이트
                  return [
                    ...old.slice(0, -1),
                    { ...lastItem, text: (lastItem.text || '') + data.text }
                  ];
                }
              );
              callbacks?.message_delta?.(data);
            },
            message_end: (finalData) => {
              // 최종 데이터로 캐시 교체
              queryClient.setQueryData(
                YOUR_QUERY_KEY.GET_YOUR_ENDPOINT(id),
                (old: YourResponseDto[] = []) => [
                  ...old.slice(0, -1),
                  finalData
                ]
              );

              // 관련 쿼리 무효화
              queryClient.invalidateQueries({
                queryKey: YOUR_QUERY_KEY.GET_YOUR_ENDPOINT(id),
              });

              callbacks?.message_end?.(finalData);
              resolve();
            },
            error: (error) => {
              callbacks?.error?.(error);
              reject(error);
            },
          },
        });
      });
    },
    mutationKey: YOUR_MUTATION_KEY.POST_YOUR_ENDPOINT,
  });

  return mutation;
}
```

## 2. React 컴포넌트에서 사용

```typescript
import { useState } from 'react';
import { useYourStreamMutation } from './hooks/use-your-stream-mutation';

function ChatComponent() {
  const [streamingText, setStreamingText] = useState('');
  const mutation = useYourStreamMutation();

  const handleSubmit = (message: string) => {
    setStreamingText(''); // 초기화

    mutation.mutate({
      id: 123,
      payload: { content: message },
      callbacks: {
        message_start: (data) => {
          console.log('스트림 시작:', data.id);
        },
        message_delta: (data) => {
          // 실시간으로 텍스트 누적
          setStreamingText(prev => prev + data.text);
        },
        message_end: (data) => {
          console.log('스트림 완료:', data);
          setStreamingText(''); // 완료 후 초기화
        },
        error: (error) => {
          console.error('에러 발생:', error);
        },
      },
    });
  };

  return (
    <div>
      <button
        onClick={() => handleSubmit('Hello!')}
        disabled={mutation.isPending}
      >
        전송
      </button>

      {mutation.isPending && (
        <div>스트리밍 중: {streamingText}</div>
      )}
    </div>
  );
}
```

## 3. 캐시 업데이트 전략

### Optimistic Update (즉시 반영)

```typescript
message_start: (data) => {
  // 새 데이터를 즉시 캐시에 추가
  queryClient.setQueryData(
    YOUR_QUERY_KEY.GET_LIST(id),
    (old = []) => [...old, data]
  );
}
```

### Incremental Update (증분 업데이트)

```typescript
message_delta: (data) => {
  // 마지막 항목을 증분 데이터로 업데이트
  queryClient.setQueryData(
    YOUR_QUERY_KEY.GET_LIST(id),
    (old = []) => {
      const lastItem = old[old.length - 1];
      return [
        ...old.slice(0, -1),
        { ...lastItem, text: lastItem.text + data.text }
      ];
    }
  );
}
```

### Final Update (최종 업데이트)

```typescript
message_end: (finalData) => {
  // 최종 데이터로 교체
  queryClient.setQueryData(
    YOUR_QUERY_KEY.GET_LIST(id),
    (old = []) => [...old.slice(0, -1), finalData]
  );

  // 쿼리 무효화로 서버 데이터와 동기화
  queryClient.invalidateQueries({
    queryKey: YOUR_QUERY_KEY.GET_LIST(id),
  });
}
```

## 4. 스트림 취소 (선택사항)

```typescript
export function useYourStreamMutation() {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id, payload, callbacks }) => {
      // 새 AbortController 생성
      abortControllerRef.current = new AbortController();

      return new Promise((resolve, reject) => {
        abortControllerRef.current.signal.addEventListener(
          'abort',
          () => reject(new Error('Stream aborted')),
          { once: true }
        );

        yourApi.streamingEndpoint({
          id,
          payload,
          callbacks: { /* ... */ },
          options: {
            signal: abortControllerRef.current.signal
          }
        });
      });
    },
  });

  const cancelStream = () => {
    abortControllerRef.current?.abort();
  };

  return { ...mutation, cancelStream };
}
```

## 참고 자료

- [TanStack Query - Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
