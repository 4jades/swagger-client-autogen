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
- 🛡️ **Zod 스키마 생성** - 런타임 타입 검증 (선택사항)
- 🔗 **API Call Graph** - 뮤테이션 → 쿼리 자동 연결
- 📁 **모듈러 구조** - 태그별 코드 분리

## 📋 목차

1. [🚀 Quick Start](#-quick-start)
2. [📖 사용법](#-사용법)
3. [⚙️ 설정 옵션](#️-설정-옵션)
4. [🎯 생성되는 코드](#-생성되는-코드)
5. [🔗 API Call Graph](#-api-call-graph)
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
# 2. Swagger 파일 다운로드 및 병합 (Query Key 자동 생성)
npx swagger-client-autogen fetch --config swagger/config.ts --output swagger/api.yml

# 3. API 클라이언트 코드 생성
npx swagger-client-autogen generate --config swagger/config.ts
```

> [!TIP]  
> **`fetch` 단계에서 자동으로 처리되는 것들:**  
> 🔑 Query Key 자동 생성 (`x-query-key`)  
> 🔗 API Call Graph 연결 준비

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

**자동 처리 기능:**
- 📋 **Query Key 자동 생성**: GET 엔드포인트에 `x-query-key` 자동 추가
- 🔄 **API Call Graph 준비**: TanStack Query 무효화를 위한 기반 구조 생성 

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
  POST_USERS: ['users'],
  DELETE_USERS_USERID: ['users', 'userId'],
};

// Mutation 객체 (재사용 가능)
const mutations = {
  postUsers: () => ({
    mutationFn: ({ payload, kyInstance, options }: TUsersApiRequestParameters['postUsers']) => {
      return usersApi.postUsers({ payload, kyInstance, options });
    },
    mutationKey: USERS_MUTATION_KEY.POST_USERS,
  }),
};

export { mutations as usersMutations };

// Mutation Hooks
export const usePostUsersMutation = (
  options?: Omit<
    UseMutationOptions<UserResponseDto, DefaultError, TUsersApiRequestParameters['postUsers']>,
    'mutationFn' | 'mutationKey'
  >,
) => {
  return useMutation({
    ...mutations.postUsers(),
    ...options,
  });
};
```

## 🔗 API Call Graph

### 뮤테이션 → 쿼리 자동 무효화

API Call Graph 기능은 Swagger 파일의 `x-invalidate-query-key` 확장 필드를 기반으로 뮤테이션 성공 시 관련 쿼리를 자동으로 무효화합니다.

#### Swagger 확장 필드 활용

**1. Query Key 자동 생성 (`x-query-key`)**

> [!NOTE]  
> **`x-query-key`는 `fetch` 명령어 실행 시 경로 기반으로 자동 생성됩니다.**  
> 사용자가 수동으로 작성할 필요가 없으며, API 경로 구조에 따라 최적의 쿼리 키가 자동으로 할당됩니다.

```yaml
# fetch 명령어로 자동 생성되는 Query Key 예시
/chats:
  get:
    x-query-key: 'GET_CHATS()'                    # 자동 생성
    
/chats/{chat_id}:
  get:
    x-query-key: 'GET_CHATS_CHATID($parameters.chat_id)'  # 자동 생성
    
/chats/{chat_id}/messages:
  get:
    x-query-key: 'GET_CHATS_CHATID_MESSAGES($parameters.chat_id)'  # 자동 생성
```

**자동 생성 규칙:**
- HTTP 메서드와 경로를 기반으로 함수명 생성 (예: `GET_CHATS_CHATID_MESSAGES`)
- 경로 매개변수는 함수 인수로 변환 (`$parameters.{param_name}`)
- 쿼리 파라미터가 있는 경우 `$parameters.$query` 추가
- 언더바(`_`)로 구분된 대문자 함수명 사용

**2. 무효화 키 정의 (`x-invalidate-query-key`)**
```yaml
# DELETE 엔드포인트에 무효화할 쿼리 키들 정의
/chats/{chat_id}:
  delete:
    x-invalidate-query-key:
      - 'GET_CHATS()'                              # 전체 채팅 목록
      - 'GET_CHATS_CHATID($parameters.chat_id)'    # 특정 채팅
      - 'GET_CHATS_CHATID_MESSAGES($parameters.chat_id)'  # 채팅 메시지
      - 'GET_CHATS_CHATID_PROBLEMS($parameters.chat_id)'  # 채팅 문제
```

**3. TanStack Query 옵션 설정**
```yaml
# 캐시 설정 최적화
/chats/init-options:
  get:
    x-query-key: '[chats, init-options]'
    x-stale-time: infinity          # 무한 캐시 유지
    
/chats/{chat_id}/options:
  get:
    x-query-key: '[chats, $parameters.chat_id, options]'
    x-stale-time: infinity          # 무한 캐시 유지  
    x-gc-time: infinity             # 가비지 컬렉션 방지
```

#### 자동 생성되는 코드

**Mutation Hook (쿼리 무효화 포함)**
```typescript
/**
 * @tags chats
 * @summary Delete Chat
 * @request DELETE:/chats/{chat_id}
 */
export const useDeleteChatsByChatIdMutation = (
  options?: Omit<
    UseMutationOptions<void, DefaultError, TChatsApiRequestParameters["deleteChatsByChatId"]>,
    "mutationFn" | "mutationKey"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutations.deleteChatsByChatId(),
    ...options,
    onSuccess: (data, variables, context) => {
              // x-invalidate-query-key 기반 자동 무효화
        queryClient.invalidateQueries({ 
          queryKey: CHATS_QUERY_KEY.GET_CHATS(),
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: CHATS_QUERY_KEY.GET_CHATS_CHATID(variables.chatId),
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: CHATS_QUERY_KEY.GET_CHATS_CHATID_MESSAGES(variables.chatId),
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: CHATS_QUERY_KEY.GET_CHATS_CHATID_PROBLEMS(variables.chatId),
          exact: true,
        });

      // 사용자 정의 onSuccess 콜백 실행
      options?.onSuccess?.(data, variables, context);
    },
  });
};
```

**Query Hook (캐시 옵션 포함)**
```typescript
/**
 * @tags chats
 * @summary Get Options
 * @request GET:/chats/{chat_id}/options
 */
export const useGetChatsByChatIdOptionsQuery = <TData = ChatOptionsListResponseDto>(
  requestArgs: TChatsApiRequestParameters['getChatsByChatIdOptions'],
  options?: Omit<UseQueryOptions<ChatOptionsListResponseDto, DefaultError, TData>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    ...queries.getChatsByChatIdOptions(requestArgs),
    ...options,
    staleTime:  Number.POSITIVE_INFINITY,    // x-stale-time: infinity
    gcTime:  Number.POSITIVE_INFINITY,       // x-gc-time: infinity
  });
};
```

#### 실제 사용 예시

```typescript
// 채팅 삭제 시 관련된 모든 쿼리가 자동으로 무효화됨
const deleteChatMutation = useDeleteChatsByChatIdMutation({
  onSuccess: () => {
    // 추가 로직 (선택사항)
    toast.success('채팅이 삭제되었습니다');
    router.push('/chats');
  }
});

// 삭제 실행
deleteChatMutation.mutate({
  chatId: 123,
  kyInstance: undefined,
  options: {}
});
```

**장점:**
- 🤖 **자동화**: 수동으로 쿼리 무효화 코드 작성 불필요
- 🎯 **정확성**: Swagger 정의와 100% 일치
- 🔄 **일관성**: 모든 뮤테이션에서 동일한 패턴 적용
- 🛡️ **안전성**: 사용자 정의 `onSuccess` 콜백과 충돌하지 않음

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
