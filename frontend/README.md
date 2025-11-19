# FormGPT Frontend

Frontend приложение для конструктора опросов с GPT помощником.

## Технологии

- React 18 + TypeScript
- Vite
- React Router v6
- React Hook Form
- Zustand
- Axios
- Tailwind CSS
- TanStack Query

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist`.

## Переменные окружения

Создайте файл `.env` в корне папки `frontend`:

```
VITE_API_URL=http://localhost:8081
```

Если переменная не задана, по умолчанию используется `http://localhost:8081`.

## Структура проекта

```
src/
├── components/       # Переиспользуемые компоненты
│   ├── ui/          # Базовые UI компоненты
│   └── ProtectedRoute.tsx
├── pages/           # Страницы приложения
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ProfilePage.tsx
├── services/        # API сервисы
│   └── api.ts
├── store/           # Zustand stores
│   └── authStore.ts
├── types/           # TypeScript типы
│   └── user.ts
├── utils/           # Утилиты
│   └── constants.ts
├── App.tsx
├── main.tsx
└── index.css
```

## API эндпоинты

Приложение использует следующие эндпоинты:

- `POST /auth/login` - авторизация
- `POST /auth/register` - регистрация
- `GET /users/me` - получение профиля
- `PUT /users/me` - обновление профиля
- `PUT /users/me/password` - смена пароля

## Особенности

- Автоматическое добавление Bearer токена к запросам
- Автоматический logout при получении 401 ошибки
- Сохранение токена в localStorage
- Валидация форм в реальном времени
- Защищенные роуты
- Адаптивный дизайн

