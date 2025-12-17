# 전역 Mutation Effect 가이드

## 개요

`swagger-client-autogen`은 TanStack Query의 mutation 성공 시 전역적으로 쿼리를 무효화하거나 특정 로직을 실행할 수 있는 **Global Mutation Effect** 시스템을 제공합니다.

이 시스템은 다음과 같은 이점을 제공합니다:
- 🎯 **중앙화된 부수 효과 관리**: 모든 mutation의 부수 효과를 한 곳에서 관리
- 🔄 **자동 쿼리 무효화**: mutation 성공 시 관련 쿼리를 자동으로 무효화
- 🛡️ **타입 안정성**: 완전한 TypeScript 타입 지원
- 🎨 **선택적 적용**: 필요한 mutation만 선택적으로 전역 효과 적용

## 아키텍처

### 1. 자동 생성되는 타입 정의

`generate` 명령어를 실행하면 `global-mutation-effect.type.ts` 파일이 자동으로 생성됩니다:

```typescript
// src/shared/api/__generated__/global-mutation-effect.type.ts

export type GlobalMutationEffectMap<M extends MutationMap> = Partial<{
  [K in keyof M]: {
    onSuccess: {
      invalidate: (
        data: ExtractMutationData<M, K>,
        variables: ExtractMutationVariables<M, K>,
        context: unknown,
        mutation: Mutation<...>,
      ) => void;
    };
  };
}>;

// 각 모듈별 타입
export type TChatsGlobalMutationEffects = GlobalMutationEffectMap<typeof chatsMutations>;
export type TGoalsGlobalMutationEffects = GlobalMutationEffectMap<typeof goalsMutations>;
// ...

// 통합 팩토리 타입
export type TGlobalMutationEffectFactory = (
  queryClient: QueryClient,
) => Partial<
  TChatsGlobalMutationEffects &
  TGoalsGlobalMutationEffects &
  // ...
>;
```

### 2. 전역 Mutation Effect 구현

`src/shared/api/global-mutation-effects.ts` 파일을 생성하고 전역 효과를 정의합니다:

```typescript
import type { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/app/provider/tanstack-query';
import { chatsQueries } from '@/entities/chats/__generated__/api/queries';
import type {
  TChatsGlobalMutationEffects,
  TGlobalMutationEffectFactory,
} from './__generated__/global-mutation-effect.type';

export const globalMutationEffects: TGlobalMutationEffectFactory = (queryClient) => ({
  ...chatGlobalMutationEffects(queryClient),
  // 다른 모듈의 effects도 여기에 추가
});

export const isGlobalMutationEffectKey = (
  key: unknown
): key is keyof ReturnType<typeof globalMutationEffects> => {
  return typeof key === 'string' &&
         Object.keys(globalMutationEffects(queryClient)).includes(key);
};

function chatGlobalMutationEffects(
  queryClient: QueryClient
): TChatsGlobalMutationEffects {
  return {
    // mutation 함수명을 키로 사용
    postChatsByChatIdProblemsByProblemIdSubmit: {
      onSuccess: {
        invalidate: (_data, variables) => {
          // 관련 쿼리 무효화
          queryClient.invalidateQueries({
            queryKey: chatsQueries.getChatsByChatIdProblems({
              chatId: variables.chatId
            }).queryKey,
            exact: true,
          });

          queryClient.invalidateQueries({
            queryKey: chatsQueries.getChatsByChatIdProblemsByProblemId({
              chatId: variables.chatId,
              problemId: variables.problemId,
            }).queryKey,
            exact: true,
          });
        },
      },
    },
  };
}
```

### 3. TanStack Query Provider 설정

`src/app/provider/tanstack-query.tsx`에서 MutationCache를 설정합니다:

```typescript
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { globalMutationEffects, isGlobalMutationEffectKey } from '@/shared/api/global-mutation-effects';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: (failureCount, error) => {
        // 에러 처리 로직
        return failureCount < 2;
      },
    },
  },
  mutationCache: new MutationCache({
    onSuccess: async (_data, _variables, _context, mutation) => {
      const disableGlobalInvalidation = mutation.options.meta?.disableGlobalInvalidation;
      const mutationFnName = mutation.options.meta?.mutationFnName;
      const mutationKey = mutation.options.mutationKey;

      // 전역 무효화 비활성화 체크
      if (disableGlobalInvalidation) {
        return;
      }

      // 전역 mutation effect 실행
      if (isGlobalMutationEffectKey(mutationFnName)) {
        const invalidate = globalMutationEffects(queryClient)[mutationFnName]?.onSuccess.invalidate;

        if (invalidate) {
          invalidate(_data as never, _variables as never, _context as never, mutation as never);
          return; // 전역 효과를 실행했으면 entity 단위 무효화는 하지 않음
        }
      }

      if (!mutationKey) return;

      // entity 단위 기본 무효화 (전역 효과가 없는 경우)
      await queryClient.invalidateQueries({
        queryKey: [mutationKey?.at(0)],
        exact: false,
      });

      // 같은 mutation 중복 제거
      const cache = queryClient.getMutationCache();
      const sameKeyMutations = cache
        .getAll()
        .filter(
          (m) => JSON.stringify(m.options.mutationKey) === JSON.stringify(mutationKey) &&
                 m.state.status === 'success',
        );

      sameKeyMutations
        .filter((m) => m !== mutation)
        .forEach((m) => {
          cache.remove(m);
        });
    },
  }),
});

export const TanstackQueryProvider = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  );
};
```

## 사용 예시

### 1. 기본 사용

특정 mutation에 대해 세밀한 쿼리 무효화가 필요한 경우:

```typescript
function chatGlobalMutationEffects(queryClient: QueryClient): TChatsGlobalMutationEffects {
  return {
    // 문제 제출 시 특정 쿼리만 무효화
    postChatsByChatIdProblemsByProblemIdSubmit: {
      onSuccess: {
        invalidate: (_data, variables) => {
          queryClient.invalidateQueries({
            queryKey: chatsQueries.getChatsByChatIdProblems({
              chatId: variables.chatId
            }).queryKey,
            exact: true,
          });
        },
      },
    },
  };
}
```

### 2. 전역 무효화 비활성화

특정 mutation hook 호출 시 전역 무효화를 비활성화하려면:

```typescript
const mutation = usePostChatsMutation({
  meta: {
    disableGlobalInvalidation: true, // 전역 무효화 비활성화
  },
  onSuccess: (data) => {
    // 커스텀 로직만 실행
  },
});
```

### 3. 응답 데이터 활용

mutation 응답 데이터를 활용한 무효화:

```typescript
postChats: {
  onSuccess: {
    invalidate: (data, variables) => {
      // 생성된 채팅 ID를 사용해 특정 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: chatsQueries.getChatsByChatId({
          chatId: data.id
        }).queryKey,
      });
    },
  },
},
```

## 작동 원리

### 1. Mutation 실행 흐름

```
1. useMutation hook 호출
   ↓
2. mutation 성공
   ↓
3. MutationCache.onSuccess 트리거
   ↓
4. disableGlobalInvalidation 체크
   ↓
5. globalMutationEffects에 등록된 효과 실행
   ↓
6. (전역 효과가 없으면) entity 단위 기본 무효화
```

### 2. Meta 정보

자동 생성된 mutation에는 `meta.mutationFnName`이 포함되어 있습니다:

```typescript
const mutations = {
  postUsers: () => ({
    mutationFn: ({ payload }: TUsersApiRequestParameters['postUsers']) => {
      return usersApi.postUsers({ payload });
    },
    mutationKey: USERS_MUTATION_KEY.POST_USERS,
    meta: {
      mutationFnName: 'postUsers', // 자동 추가됨
    }
  }),
};
```

이 `mutationFnName`이 `globalMutationEffects`의 키와 매칭됩니다.

## 모범 사례

### 1. 모듈별로 함수 분리

```typescript
export const globalMutationEffects: TGlobalMutationEffectFactory = (queryClient) => ({
  ...chatGlobalMutationEffects(queryClient),
  ...userGlobalMutationEffects(queryClient),
  ...problemGlobalMutationEffects(queryClient),
});

function chatGlobalMutationEffects(queryClient: QueryClient): TChatsGlobalMutationEffects {
  // 채팅 관련 mutation effects
}

function userGlobalMutationEffects(queryClient: QueryClient): TUsersGlobalMutationEffects {
  // 사용자 관련 mutation effects
}
```

### 2. 세밀한 무효화 vs 광범위한 무효화

**세밀한 무효화 (권장):**
```typescript
invalidate: (_data, variables) => {
  queryClient.invalidateQueries({
    queryKey: chatsQueries.getChatsByChatId({ chatId: variables.chatId }).queryKey,
    exact: true, // 정확히 일치하는 쿼리만
  });
}
```

**광범위한 무효화:**
```typescript
invalidate: () => {
  queryClient.invalidateQueries({
    queryKey: [CHATS_QUERY_KEY.GET_CHATS()],
    exact: false, // 접두사가 일치하는 모든 쿼리
  });
}
```

### 3. 타입 안정성 활용

생성된 타입을 활용하면 컴파일 타임에 오류를 잡을 수 있습니다:

```typescript
// ✅ 올바른 mutation 함수명
postChatsByChatIdProblemsByProblemIdSubmit: { ... }

// ❌ 타입 오류 발생
postChatsInvalidName: { ... } // Property does not exist
```

## 참고

- [TanStack Query - Mutation Cache](https://tanstack.com/query/latest/docs/reference/MutationCache)
- [TanStack Query - Query Invalidation](https://tanstack.com/query/latest/docs/guides/query-invalidation)
