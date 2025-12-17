# 🚀 swagger-client-autogen

> Swagger/OpenAPI에서 TypeScript API 클라이언트 코드를 자동 생성하는 CLI 도구

[![npm version](https://badge.fury.io/js/swagger-client-autogen.svg)](https://badge.fury.io/js/swagger-client-autogen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🎯 한 번의 명령어로 완전한 TypeScript API 클라이언트를 생성하세요!**

## ✨ 주요 기능

- 🚀 **인터랙티브 초기화** - `init` 명령어로 빠른 설정
- 📝 **TypeScript 완벽 지원** - 완전한 타입 안정성
- ⚡ **Ky HTTP 클라이언트** - 현대적이고 가벼운 HTTP 클라이언트
- 🔄 **TanStack Query 통합** - React Query hooks 자동 생성
- 🎯 **전역 Mutation Effects** - 중앙화된 쿼리 무효화 관리
- 🛡️ **Zod 스키마 생성** - 런타임 타입 검증 (선택사항)
- 📁 **모듈러 구조** - 태그별 코드 분리

## 📋 목차

1. [🚀 Quick Start](#-quick-start)
2. [📖 사용법](#-사용법)
3. [⚙️ 설정 옵션](#️-설정-옵션)
4. [🎯 생성되는 코드](#-생성되는-코드)
5. [🔄 전역 Mutation Effects](#-전역-mutation-effects)
6. [🛠️ 고급 기능](#️-고급-기능)
7. [🔧 개발 가이드](#-개발-가이드)
8. [📝 예시](#-예시)
9. [❓ FAQ](#-faq)
10. [🐛 트러블슈팅](#-트러블슈팅)
11. [📄 라이선스](#-라이선스)

## 🚀 Quick Start

### 설치

```bash
# 프로젝트에 개발 의존성으로 설치 (권장)
npm install -D swagger-client-autogen

# 또는 yarn
yarn add -D swagger-client-autogen
```
> [!TIP]  
> **💡 개발 의존성 설치를 권장하는 이유:**  
> 🎯 **타입 지원**: 설정 파일 작성 시 `InputCodegenConfig` 타입 힌트 및 자동완성

**📋 package.json 스크립트 활용 (선택사항):**
```json
{
  "scripts": {
    "api:init": "swagger-client-autogen init",
    "api:fetch": "swagger-client-autogen fetch --config swagger/config.ts --output swagger/api.yml",
    "api:generate": "swagger-client-autogen generate --config swagger/config.ts"
  }
}
```

그러면 `npm run api:generate`로 간편하게 실행할 수 있습니다.

### 초기화 (init)

**🎯 인터랙티브 설정으로 빠른 시작!**

```bash
# 1. 프로젝트 루트에서 초기화 실행
npx swagger-client-autogen init
```

대화형 질문에 답변하세요:

```
🚀 swagger-client-autogen 초기화

💡 지원하는 입력 형식
│ 로컬 파일: ./swagger.yml, api/swagger.json
│ 원격 URL: https://api.example.com/swagger.json
│ 개발 서버: http://localhost:3000/api-docs

📋 Swagger JSON/YAML 경로: https://api.example.com/swagger.json
🔒 인증이 필요한 API인가요? No
📝 Zod 스키마를 생성할까요? Yes
📂 Config 파일명: swagger/config.ts
```

### API 클라이언트 생성

```bash
# 2. Swagger 파일 다운로드 및 병합
npx swagger-client-autogen fetch --config swagger/config.ts --output swagger/api.yml

# 3. API 클라이언트 코드 생성
npx swagger-client-autogen generate --config swagger/config.ts
```

### 생성된 파일들

```
src/
├── shared/api/                    # 공통 API 파일들
│   ├── dto.ts                     # TypeScript 타입 정의
│   ├── schema.gen.ts              # Zod 스키마 (선택)
│   ├── utils.gen.ts               # API 유틸리티
│   ├── stream.gen.ts              # 스트림 유틸리티
│   └── type-guards.gen.ts         # 타입 가드
└── entities/{moduleName}/api/     # 모듈별 API 파일들
    ├── index.ts                   # API 클라이언트 클래스
    ├── instance.ts                # API 클라이언트 인스턴스
    ├── queries.ts                 # TanStack Query hooks
    └── mutations.ts               # TanStack Query mutations
```

**✨ 바로 사용 가능한 코드가 생성됩니다!**

```typescript
import { useGetUsersQuery, usePostUsersMutation } from '@/entities/users/api';

// GET 요청 - Query Hook
const { data: users, isLoading } = useGetUsersQuery();

// POST 요청 - Mutation Hook
const createUserMutation = usePostUsersMutation({
  onSuccess: (data) => {
    console.log('사용자 생성 성공:', data);
  }
});

// 뮤테이션 실행
createUserMutation.mutate({
  payload: { name: 'John', email: 'john@example.com' },
});
```

## 📖 사용법

### CLI 명령어

#### `init` - 초기화

```bash
npx swagger-client-autogen init
```

인터랙티브 방식으로 설정 파일을 생성합니다. 이곳에서 생성된 설정 파일은 fetch, generate 명령에서 사용됩니다.

#### `fetch` - Swagger 파일 다운로드

```bash
npx swagger-client-autogen fetch --config swagger/config.ts --output swagger/api.yml
```

Config 파일에서 지정된 웹 URL로부터 Swagger 파일을 다운로드하고 병합합니다.

**옵션:**
- `--config, -c`: 설정 파일 경로 (필수)
- `--output, -o`: 출력 파일 경로 (선택, 기본값: `swagger/{title}.yml`)

#### `generate` - 코드 생성

```bash
npx swagger-client-autogen generate --config swagger/config.ts
```

API 클라이언트 코드를 생성합니다.

#### 도움말

```bash
npx swagger-client-autogen --help
npx swagger-client-autogen init --help
```

### 설정 파일

`init` 명령어로 생성되는 설정 파일 예시:

```typescript
// swagger/config.ts
import type { InputCodegenConfig } from 'swagger-client-autogen';

const config: InputCodegenConfig = {
  // Swagger 설정
  uri: 'https://api.example.com/swagger.json',
  
  // 인증 정보 (선택)
  username: 'your-username',
  password: 'your-password',
  
  // 스키마 생성 여부
  createSchema: true,

  // 출력 설정 (필요에 따라 주석 해제하여 사용)
  /*
  customOutput: {
    aliasInfo: {
      aliasMap: { '@': 'src' },  // path alias 설정
      aliasMapDepth: 2,          // alias 탐색 깊이
    },
    pathInfo: {
      dto: 'src/shared/api/dto.ts',
      api: 'src/entities/{moduleName}/api/index.ts',
      apiInstance: 'src/entities/{moduleName}/api/instance.ts',
      queries: 'src/entities/{moduleName}/api/queries.ts',
      mutations: 'src/entities/{moduleName}/api/mutations.ts',
      schema: 'src/shared/api/schema.gen.ts',
      apiUtils: 'src/shared/api/utils.gen.ts',
      streamUtils: 'src/shared/api/stream.gen.ts',
      typeGuards: 'src/shared/api/type-guards.gen.ts',
      streamHandlers: 'src/entities/{moduleName}/api/stream-handlers',
    },
  },
  */
};

export default config;
```

## ⚙️ 설정 옵션

### 기본 설정

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `uri` | `string` | - | Swagger JSON/YAML 파일 경로 또는 URL |
| `createSchema` | `boolean` | `false` | Zod 스키마 생성 여부 |

### 인증 설정

> swagger에 인증 정보가 필요한 경우에만 입력해주세요.

```typescript
{
  // 최상위 레벨에 설정
  username: 'your-username',
  password: 'your-password'
}
```

### 고급 옵션 (customOutput)

```typescript
{
  customOutput: {
    aliasInfo: {
      aliasMap: { '@': 'src' },      // path alias 설정
      aliasMapDepth: 2               // alias 탐색 깊이
    },
    pathInfo: {
      dto: 'src/shared/api/dto.ts',
      api: 'src/entities/{moduleName}/api/index.ts',
      apiInstance: 'src/entities/{moduleName}/api/instance.ts',
      queries: 'src/entities/{moduleName}/api/queries.ts',
      mutations: 'src/entities/{moduleName}/api/mutations.ts',
      schema: 'src/shared/api/schema.gen.ts',
      // ... 기타 경로 설정
    }
  }
}
```

**💡 개선된 점:**
- `pathInfo`에서 `alias` 필드 제거 - 중복 제거!
- `aliasMap`을 기반으로 alias 자동 계산
- 더 간결하고 DRY한 설정 구조

## 🎯 생성되는 코드

### API 클라이언트 클래스

```typescript
// src/entities/user/api/index.ts
import type { KyInstance, Options } from 'ky';
import { z } from 'zod';
import type { GetUserResponseDto, CreateUserRequestDto, CreateUserResponseDto } from '@/shared/api/dto';
import { getUserResponseDtoSchema, createUserRequestDtoSchema, createUserResponseDtoSchema } from '@/shared/api/schema.gen';
import { validateSchema } from '@/shared/api/utils.gen';

export class UserApi {
  private readonly instance: KyInstance;

  constructor(instance: KyInstance) {
    this.instance = instance;
  }

  /**
   * @tags users
   * @summary Get User
   * @request GET:/users/{id}
   */
  async getUser({
    id,
    kyInstance,
    options,
  }: TUserApiRequestParameters['getUser']) {
    const instance = kyInstance ?? this.instance;

    const response = await instance
      .get<GetUserResponseDto>(`users/${id}`, {
        ...options,
      })
      .json();

    const validateResponse = validateSchema(getUserResponseDtoSchema, response);
    return validateResponse;
  }

  /**
   * @tags users
   * @summary Create User
   * @request POST:/users
   */
  async createUser({
    payload,
    kyInstance,
    options,
  }: TUserApiRequestParameters['createUser']) {
    const instance = kyInstance ?? this.instance;
    const validatedPayload = validateSchema(createUserRequestDtoSchema, payload);

    const response = await instance
      .post<CreateUserResponseDto>(`users`, {
        json: validatedPayload,
        ...options,
      })
      .json();

    const validateResponse = validateSchema(createUserResponseDtoSchema, response);
    return validateResponse;
  }
}

export type TUserApiRequestParameters = {
  getUser: {
    id: number;
    kyInstance?: KyInstance;
    options?: Options;
  };
  createUser: {
    payload: CreateUserRequestDto;
    kyInstance?: KyInstance;
    options?: Options;
  };
};
```

### API 클라이언트 인스턴스

```typescript
// src/entities/user/api/instance.ts
import { UserApi } from './index';

// API 클래스의 인스턴스를 생성하여 내보냄
export const userApi = new UserApi();
```

### TypeScript 타입

```typescript
// src/shared/api/dto.ts
export type GetUserResponseDto = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export type CreateUserRequestDto = {
  name: string;
  email: string;
}
```

### Zod 스키마

```typescript
// src/shared/api/schema.gen.ts
import { z } from 'zod';

export const GetUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string()
});

export const CreateUserRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});
```

### TanStack Query Hooks

**📋 queries.ts - 쿼리 훅**
```typescript
// src/entities/users/api/queries.ts
import type { DefaultError, UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { UserResponseDto, UnknownConceptReadResponseDto } from '@/shared/api/dto';
import type { TUsersApiRequestParameters } from './index';
import { usersApi } from './instance';

// Query Keys
export const USERS_QUERY_KEY = {
  GET_USERS: () => ['users'],
  GET_USERS_USERID: (userId: string) => ['users', userId],
  GET_USERS_USERID_UNKNOWN_CONCEPTS: (userId: string, params?: any) => 
    ['users', userId, 'unknown_concepts', params],
};

// Query 객체 (재사용 가능)
const queries = {
  getUsers: ({ kyInstance, options }: TUsersApiRequestParameters['getUsers']) => ({
    queryKey: USERS_QUERY_KEY.GET_USERS(),
    queryFn: () => usersApi.getUsers({ kyInstance, options }),
  }),
  getUsersByUserId: ({ userId, kyInstance, options }: TUsersApiRequestParameters['getUsersByUserId']) => ({
    queryKey: USERS_QUERY_KEY.GET_USERS_USERID(userId),
    queryFn: () => usersApi.getUsersByUserId({ userId, kyInstance, options }),
  }),
};

export { queries as usersQueries };

// Query Hooks
export const useGetUsersQuery = <TData = UserResponseDto[]>(
  requestArgs: TUsersApiRequestParameters['getUsers'],
  options?: Omit<UseQueryOptions<UserResponseDto[], DefaultError, TData>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    ...queries.getUsers(requestArgs),
    ...options,
  });
};

// Suspense Query Hooks
export const useGetUsersSuspenseQuery = <TData = UserResponseDto[]>(
  requestArgs: TUsersApiRequestParameters['getUsers'],
  options?: Omit<UseQueryOptions<UserResponseDto[], DefaultError, TData>, 'queryKey' | 'queryFn'>,
) => {
  return useSuspenseQuery({
    ...queries.getUsers(requestArgs),
    ...options,
  });
};
```

**🔄 mutations.ts - 뮤테이션 훅**
```typescript
// src/entities/users/api/mutations.ts
import type { DefaultError, UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { UserResponseDto } from '@/shared/api/dto';
import type { TUsersApiRequestParameters } from './index';
import { usersApi } from './instance';

// Mutation Keys
export const USERS_MUTATION_KEY = {
  POST_USERS: ['users'] as const,
  DELETE_USERS_USERID: ['users', 'userId'] as const,
};

// Mutation 객체 (재사용 가능)
const mutations = {
  postUsers: () => ({
    mutationFn: ({ payload, kyInstance, options }: TUsersApiRequestParameters['postUsers']) => {
      return usersApi.postUsers({ payload, kyInstance, options });
    },
    mutationKey: USERS_MUTATION_KEY.POST_USERS,
    meta: {
      mutationFnName: 'postUsers',
    }
  }),
};

export { mutations as usersMutations };

// Mutation Hooks
export const usePostUsersMutation = <TContext = unknown>(
  options?: Omit<
    UseMutationOptions<UserResponseDto, DefaultError, TUsersApiRequestParameters['postUsers'], TContext>,
    'mutationFn' | 'mutationKey'
  >,
) => {
  return useMutation({
    ...mutations.postUsers(),
    ...options,
  });
};
```

## 🔄 전역 Mutation Effects

`swagger-client-autogen`은 TanStack Query의 mutation 성공 시 전역적으로 쿼리를 무효화하거나 특정 로직을 실행할 수 있는 **Global Mutation Effect** 시스템을 제공합니다.

### 주요 이점

- 🎯 **중앙화된 부수 효과 관리**: 모든 mutation의 부수 효과를 한 곳에서 관리
- 🔄 **자동 쿼리 무효화**: mutation 성공 시 관련 쿼리를 자동으로 무효화
- 🛡️ **타입 안정성**: 완전한 TypeScript 타입 지원
- 🎨 **선택적 적용**: 필요한 mutation만 선택적으로 전역 효과 적용

### 자동 생성되는 타입 파일

`generate` 명령어를 실행하면 `global-mutation-effect.type.ts` 파일이 자동으로 생성됩니다:

```typescript
// src/shared/api/global-mutation-effect.type.ts

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
export type TUsersGlobalMutationEffects = GlobalMutationEffectMap<typeof usersMutations>;
export type TChatsGlobalMutationEffects = GlobalMutationEffectMap<typeof chatsMutations>;
// ...

// 통합 팩토리 타입
export type TGlobalMutationEffectFactory = (
  queryClient: QueryClient,
) => Partial<
  TUsersGlobalMutationEffects &
  TChatsGlobalMutationEffects &
  // ...
>;
```

### 사용 예시

**1. 전역 Mutation Effects 구현**

```typescript
// src/shared/api/global-mutation-effects.ts
import type { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/app/provider/tanstack-query';
import { usersQueries } from '@/entities/users/api/queries';
import type {
  TUsersGlobalMutationEffects,
  TGlobalMutationEffectFactory,
} from './global-mutation-effect.type';

export const globalMutationEffects: TGlobalMutationEffectFactory = (queryClient) => ({
  ...userGlobalMutationEffects(queryClient),
  // 다른 모듈의 effects도 여기에 추가
});

export const isGlobalMutationEffectKey = (
  key: unknown
): key is keyof ReturnType<typeof globalMutationEffects> => {
  return typeof key === 'string' &&
         Object.keys(globalMutationEffects(queryClient)).includes(key);
};

function userGlobalMutationEffects(
  queryClient: QueryClient
): TUsersGlobalMutationEffects {
  return {
    // mutation 함수명을 키로 사용
    postUsers: {
      onSuccess: {
        invalidate: (_data, variables) => {
          // 관련 쿼리 무효화
          queryClient.invalidateQueries({
            queryKey: usersQueries.getUsers({}).queryKey,
            exact: true,
          });
        },
      },
    },
  };
}
```

**2. TanStack Query Provider 설정**

```typescript
// src/app/provider/tanstack-query.tsx
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { globalMutationEffects, isGlobalMutationEffectKey } from '@/shared/api/global-mutation-effects';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: (failureCount, error) => {
        return failureCount < 2;
      },
    },
  },
  mutationCache: new MutationCache({
    onSuccess: async (_data, _variables, _context, mutation) => {
      const disableGlobalInvalidation = mutation.options.meta?.disableGlobalInvalidation;
      const mutationFnName = mutation.options.meta?.mutationFnName;

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

      // entity 단위 기본 무효화 (전역 효과가 없는 경우)
      const mutationKey = mutation.options.mutationKey;
      if (!mutationKey) return;

      await queryClient.invalidateQueries({
        queryKey: [mutationKey?.at(0)],
        exact: false,
      });
    },
  }),
});

export const TanstackQueryProvider = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

**3. 전역 무효화 비활성화 (선택적)**

특정 mutation 호출 시 전역 무효화를 비활성화하려면:

```typescript
const mutation = usePostUsersMutation({
  meta: {
    disableGlobalInvalidation: true, // 전역 무효화 비활성화
  },
  onSuccess: (data) => {
    // 커스텀 로직만 실행
  },
});
```

### 자세한 가이드

전역 Mutation Effects 시스템에 대한 자세한 설명은 다음 문서를 참고하세요:

📖 [전역 Mutation Effect 가이드](./.docs/global-mutation-effects.md)

이 가이드에서는 다음 내용을 다룹니다:
- 아키텍처 상세 설명
- 작동 원리
- 다양한 사용 패턴
- 모범 사례
- 트러블슈팅

## 🔧 개발 가이드

### 프로젝트 구조

```
swagger-client-autogen/
├── scripts/           # CLI 스크립트
│   ├── cli.ts        # 메인 CLI
│   ├── init.ts       # 초기화 스크립트
│   ├── fetch-swagger.js
│   └── generate-all.js
├── templates/         # 코드 생성 템플릿
├── config-builders/   # 설정 빌더
├── utils/            # 유틸리티 함수
└── types/            # 타입 정의
```

### 빌드 방법

```bash
# 개발 환경 설정
git clone https://github.com/your-org/swagger-client-autogen
cd swagger-client-autogen
yarn install

# 빌드
yarn build

# 개발 모드 (watch)
yarn build:watch
```

### 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'Add amazing feature'`
4. 푸시: `git push origin feature/amazing-feature`
5. Pull Request 생성

## ❓ FAQ

### Q: Swagger 파일이 인증이 필요한 경우는?

A: `init` 명령어 실행 시 인증 정보를 입력하거나, 설정 파일에 직접 추가하세요.

```typescript
{
  username: 'your-username',
  password: 'your-password'
}
```

### Q: 생성된 코드를 커스터마이징하고 싶다면?

A: 현재는 템플릿 커스터마이징을 지원하지 않습니다. 생성된 코드를 직접 수정하거나, 래퍼 함수를 만들어 사용하세요.

### Q: TypeScript 대신 JavaScript로 생성할 수 있나요?

A: TypeScript만 지원합니다. 

## 🐛 트러블슈팅

### Swagger 파일 다운로드 실패

```
Error: Failed to fetch swagger file
```

**해결 방법:**
1. URL이 올바른지 확인
2. 인증이 필요한 경우 `username`, `password` 설정 확인

### 생성된 코드에서 타입 오류

```
Type 'unknown' is not assignable to type 'UserDto'
```

**해결 방법:**
1. Swagger 스키마가 올바르게 정의되었는지 확인

## 📄 라이선스

[MIT License](https://opensource.org/licenses/MIT)

---

**🚀 Happy Coding!**

이 도구가 도움이 되었다면 ⭐ 별표를 눌러주세요!
