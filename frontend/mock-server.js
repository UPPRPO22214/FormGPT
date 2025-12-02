import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Хранилище "в памяти" для тестирования
let users = [];
let tokens = new Map(); // token -> userId
let nextUserId = 1;
let surveys = [];
let nextSurveyId = 1;

// Инициализация тестовых опросов
function initializeTestSurvey(userId) {
  const now = Date.now();
  
  const testSurvey1 = {
    id: String(nextSurveyId++),
    userId: userId,
    title: 'Опрос об удовлетворенности продуктом',
    description: 'Помогите нам улучшить наш продукт, ответив на несколько вопросов',
    questions: [
      {
        id: '1',
        type: 'single_choice',
        text: 'Как вы оцениваете общее качество продукта?',
        required: true,
        options: [
          { id: '1-1', text: 'Отлично' },
          { id: '1-2', text: 'Хорошо' },
          { id: '1-3', text: 'Удовлетворительно' },
          { id: '1-4', text: 'Плохо' },
        ],
        order: 0,
      },
      {
        id: '2',
        type: 'multiple_choice',
        text: 'Какие функции вы используете чаще всего?',
        required: false,
        options: [
          { id: '2-1', text: 'Создание опросов' },
          { id: '2-2', text: 'Анализ результатов' },
          { id: '2-3', text: 'Экспорт данных' },
          { id: '2-4', text: 'Шаблоны опросов' },
        ],
        order: 1,
      },
      {
        id: '3',
        type: 'scale',
        text: 'Насколько вероятно, что вы порекомендуете наш продукт друзьям?',
        required: true,
        min: 1,
        max: 10,
        order: 2,
      },
      {
        id: '4',
        type: 'text',
        text: 'Что бы вы хотели улучшить в нашем продукте?',
        required: false,
        order: 3,
      },
    ],
    createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней назад
    updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 дня назад
  };
  
  const testSurvey2 = {
    id: String(nextSurveyId++),
    userId: userId,
    title: 'Исследование предпочтений пользователей',
    description: 'Мы проводим исследование для улучшения пользовательского опыта',
    questions: [
      {
        id: '5',
        type: 'single_choice',
        text: 'Какой интерфейс вам больше нравится?',
        required: true,
        options: [
          { id: '5-1', text: 'Современный и минималистичный' },
          { id: '5-2', text: 'Классический и функциональный' },
          { id: '5-3', text: 'Яркий и красочный' },
        ],
        order: 0,
      },
      {
        id: '6',
        type: 'text',
        text: 'Опишите ваш идеальный интерфейс',
        required: false,
        order: 1,
      },
      {
        id: '7',
        type: 'scale',
        text: 'Насколько важна для вас скорость работы приложения?',
        required: true,
        min: 1,
        max: 10,
        order: 2,
      },
    ],
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 дня назад
    updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 день назад
  };
  
  surveys.push(testSurvey1);
  surveys.push(testSurvey2);
  return [testSurvey1, testSurvey2];
}

// Генерация токена (простая имитация)
function generateToken() {
  return 'mock_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Получение пользователя по токену
function getUserByToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const userId = tokens.get(token);
  if (!userId) {
    return null;
  }
  return users.find(u => u.id === userId);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Регистрация
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  // Проверка на существующий email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'Email уже занят' });
  }

  // Создание нового пользователя
  const newUser = {
    id: nextUserId++,
    email,
    name: email.split('@')[0], // Генерируем имя из email
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Создаем тестовые опросы для нового пользователя
  console.log(`📝 Создание тестовых опросов для нового пользователя ${newUser.id} (${newUser.email})`);
  initializeTestSurvey(newUser.id);

  const token = generateToken();
  tokens.set(token, newUser.id);
  res.json({ token });
});

// Авторизация
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  // Поиск пользователя
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  // В моке принимаем любой пароль
  // Создаем тестовые опросы для пользователя, если их еще нет
  const userSurveys = surveys.filter(s => s.userId === user.id);
  if (userSurveys.length === 0) {
    console.log(`📝 Создание тестовых опросов для пользователя ${user.id} (${user.email}) при логине`);
    initializeTestSurvey(user.id);
  } else {
    console.log(`✅ У пользователя ${user.id} уже есть ${userSurveys.length} опросов`);
  }

  const token = generateToken();
  tokens.set(token, user.id);
  res.json({ token });
});

// Получение профиля (требует токен)
app.get('/users/me', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  res.json(user);
});

// Обновление профиля
app.put('/users/me', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const { email, name } = req.body;

  if (email) user.email = email;
  if (name !== undefined) user.name = name;

  res.json(user);
});

// Смена пароля
app.put('/users/me/password', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Старый и новый пароль обязательны' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Новый пароль должен быть не менее 6 символов' });
  }

  // В моке всегда успешно
  res.status(200).json({ success: true });
});

// ========== ЭНДПОИНТЫ ДЛЯ ОПРОСОВ ==========

// Получение всех опросов пользователя
app.get('/surveys', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  // Создаем тестовые опросы для пользователя, если их еще нет
  const userSurveys = surveys.filter(s => s.userId === user.id);
  if (userSurveys.length === 0) {
    console.log(`📝 Создание тестовых опросов для пользователя ${user.id} (${user.email})`);
    initializeTestSurvey(user.id);
  }

  const allUserSurveys = surveys.filter(s => s.userId === user.id);
  console.log(`📊 Возвращаем ${allUserSurveys.length} опросов для пользователя ${user.id}`);
  res.json(allUserSurveys);
});

// Получение опроса по ID
app.get('/surveys/:id', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const survey = surveys.find(s => s.id === req.params.id || s.id === String(req.params.id));
  
  if (!survey) {
    return res.status(404).json({ message: 'Опрос не найден' });
  }

  if (survey.userId !== user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому опросу' });
  }

  res.json(survey);
});

// Создание нового опроса
app.post('/surveys', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const { title, description, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Название и вопросы обязательны' });
  }

  const newSurvey = {
    id: String(nextSurveyId++),
    userId: user.id,
    title,
    description: description || '',
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  surveys.push(newSurvey);
  res.status(201).json(newSurvey);
});

// Обновление опроса
app.put('/surveys/:id', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const surveyIndex = surveys.findIndex(s => s.id === req.params.id || s.id === String(req.params.id));
  
  if (surveyIndex === -1) {
    return res.status(404).json({ message: 'Опрос не найден' });
  }

  if (surveys[surveyIndex].userId !== user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому опросу' });
  }

  const { title, description, questions } = req.body;

  if (title) surveys[surveyIndex].title = title;
  if (description !== undefined) surveys[surveyIndex].description = description;
  if (questions) surveys[surveyIndex].questions = questions;
  surveys[surveyIndex].updatedAt = new Date().toISOString();

  res.json(surveys[surveyIndex]);
});

// Удаление опроса
app.delete('/surveys/:id', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const surveyIndex = surveys.findIndex(s => s.id === req.params.id || s.id === String(req.params.id));
  
  if (surveyIndex === -1) {
    return res.status(404).json({ message: 'Опрос не найден' });
  }

  if (surveys[surveyIndex].userId !== user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому опросу' });
  }

  surveys.splice(surveyIndex, 1);
  res.status(204).send();
});

// Анализ опроса через GPT (мок)
app.post('/gpt/surveys/:id/analyze', (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ message: 'Токен не предоставлен или невалиден' });
  }

  const surveyId = req.params.id;
  const survey = surveys.find(s => s.id === surveyId || s.id === String(surveyId));

  if (!survey) {
    return res.status(404).json({ message: 'Опрос не найден' });
  }

  if (survey.userId !== user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому опросу' });
  }

  // Моковый анализ опроса
  const questionCount = survey.questions?.length || 0;
  let score = 'good';
  let text = '';

  if (questionCount < 3) {
    score = 'bad';
    text = 'Ваш опрос содержит слишком мало вопросов. Рекомендуется добавить минимум 3-5 вопросов для получения более полной картины.';
  } else if (questionCount < 5) {
    score = 'average';
    text = 'Опрос содержит достаточное количество вопросов, но можно добавить еще несколько для более глубокого анализа. Убедитесь, что вопросы покрывают все важные аспекты темы.';
  } else {
    score = 'good';
    text = 'Отличный опрос! Количество вопросов оптимальное. Рекомендации:\n\n1. Убедитесь, что вопросы логически связаны между собой\n2. Проверьте, что все обязательные вопросы действительно необходимы\n3. Рассмотрите возможность добавления открытых вопросов для получения более развернутых ответов\n4. Проверьте формулировки вопросов на предмет двусмысленности';
  }

  // Добавляем дополнительные рекомендации на основе типов вопросов
  const hasTextQuestion = survey.questions?.some(q => q.type === 'text');
  const hasScaleQuestion = survey.questions?.some(q => q.type === 'scale');
  
  if (!hasTextQuestion) {
    text += '\n\n💡 Совет: Добавьте хотя бы один открытый вопрос (тип "текст"), чтобы получить качественные ответы и инсайты от респондентов.';
  }
  
  if (!hasScaleQuestion) {
    text += '\n\n💡 Совет: Вопросы со шкалой (1-10) отлично подходят для измерения удовлетворенности и оценки важности различных аспектов.';
  }

  res.json({
    text: text.trim(),
    score: score,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server запущен на http://localhost:${PORT}`);
  console.log(`📝 Доступные эндпоинты:`);
  console.log(`   POST /auth/register`);
  console.log(`   POST /auth/login`);
  console.log(`   GET  /users/me`);
  console.log(`   PUT  /users/me`);
  console.log(`   PUT  /users/me/password`);
  console.log(`   GET  /surveys`);
  console.log(`   GET  /surveys/:id`);
  console.log(`   POST /surveys`);
  console.log(`   PUT  /surveys/:id`);
  console.log(`   DELETE /surveys/:id`);
  console.log(`   POST /gpt/surveys/:id/analyze`);
  console.log(`\n✨ Тестовые опросы будут автоматически созданы для всех пользователей, у которых их еще нет`);
});

