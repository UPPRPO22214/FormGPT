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

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server запущен на http://localhost:${PORT}`);
  console.log(`📝 Доступные эндпоинты:`);
  console.log(`   POST /auth/register`);
  console.log(`   POST /auth/login`);
  console.log(`   GET  /users/me`);
  console.log(`   PUT  /users/me`);
  console.log(`   PUT  /users/me/password`);
});

