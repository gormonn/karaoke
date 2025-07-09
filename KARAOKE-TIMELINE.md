# Быстрый старт: Таймлайн караоке

## Что создано

✅ **Timeline** - основной компонент таймлайна  
✅ **Editor** - интегрированный редактор (Player + Timeline)  
✅ **StandaloneTimeline** - автономный таймлайн  

## Как посмотреть

1. Запустите проект:
   ```bash
   npm run dev
   ```

2. Откройте браузер на `http://localhost:3000`

3. В левой панели выберите композицию:
   - **"Editor"** - полный редактор с Player и Timeline
   - **"StandaloneTimeline"** - только Timeline с элементами управления

## Возможности

### ✨ Автоматическое создание треков
- Треки создаются автоматически из `segment.words`
- Дополнительные треки для `segment.lines` если есть
- Каждое слово представлено блоком на временной шкале

### 🎮 Интерактивность
- **Перетаскивание**: Перетащите блок слова для изменения времени
- **Навигация**: Кликните по временной шкале для перехода
- **Синхронизация**: Player и Timeline автоматически синхронизированы

### 🎨 Визуализация
- **Активные слова**: Золотая подсветка (#FFD700)
- **Временная шкала**: Метки каждые 5 секунд
- **Индикатор времени**: Красная линия показывает текущий момент

## Использование Timeline в своем проекте

```tsx
import {Timeline} from './Timeline';

const MyEditor = () => {
  const [segments, setSegments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <Timeline
      segments={segments}
      currentTime={currentTime}
      onTimeChange={(time) => console.log('Время:', time)}
      onItemUpdate={(id, start, end) => {
        console.log('Обновлено:', id, start, end);
      }}
    />
  );
};
```

## Структура файлов

```
src/
├── Timeline.tsx           # Основной компонент
├── Editor.tsx             # Player + Timeline
├── StandaloneTimeline.tsx # Автономный Timeline
└── types.ts               # Типы данных
```

## Данные

Timeline работает с данными формата:
```typescript
interface Segment {
  id: number;
  words: Word[];      // Массив слов
  lines?: Word[][];   // Опционально: строки
}

interface Word {
  word: string;
  start: number;      // Время начала в секундах
  end: number;        // Время окончания в секундах
  probability: number;
}
```

## Подробная документация

См. [TIMELINE.md](./TIMELINE.md) для полного API и примеров. 