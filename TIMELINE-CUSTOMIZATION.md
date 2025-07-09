# Кастомизация Timeline в Remotion Studio

## Обзор

В Remotion Studio есть встроенный Timeline компонент, который можно кастомизировать несколькими способами:

1. **Конфигурация через `remotion.config.ts`**
2. **Использование собственного Timeline компонента**
3. **Создание кастомного Studio с Timeline**

## 1. Конфигурация через remotion.config.ts

### Доступные настройки Timeline:

```typescript
// remotion.config.ts
import {Config} from '@remotion/cli/config';

// Количество треков в Timeline
Config.setMaxTimelineTracks(20); // По умолчанию: 15

// Горячие клавиши
Config.setKeyboardShortcutsEnabled(true);

// Порт Studio 
Config.setStudioPort(3001);
```

### Полный список настроек Timeline:

| Функция | Описание | По умолчанию |
|---------|----------|--------------|
| `setMaxTimelineTracks(n)` | Максимальное количество треков | 15 |
| `setKeyboardShortcutsEnabled(bool)` | Включить горячие клавиши | `true` |
| `setStudioPort(port)` | Порт для Studio | автовыбор |

## 2. Структура Timeline в @remotion/studio

### Компоненты Timeline:

```
@remotion/studio/dist/components/Timeline/
├── Timeline.js                    # Главный компонент
├── TimelineTracks.js             # Треки
├── TimelineSlider.js             # Слайдер
├── TimelineTimeIndicators.js     # Временные метки
├── TimelineInOutPointer.js       # Указатели начала/конца
├── TimelineDragHandler.js        # Обработка перетаскивания
└── TimelineScrollable.js         # Прокрутка
```

### Как работает Timeline:

Timeline автоматически создается на основе:
- **Sequences** из композиции Remotion
- **Видео конфигурации** (длительность, FPS)
- **Контекста Remotion**

## 3. Импорт Timeline из @remotion/studio

⚠️ **Важно**: Timeline не экспортируется как публичный API!

### Попытка прямого импорта:

```typescript
// ❌ НЕ РАБОТАЕТ - Timeline не экспортируется
import { Timeline } from '@remotion/studio';

// ❌ НЕ РАБОТАЕТ - внутренний файл
import { Timeline } from '@remotion/studio/dist/components/Timeline/Timeline';

// ✅ РАБОТАЕТ - через require (но нестабильно)
const { Timeline } = require('@remotion/studio/dist/components/Timeline/Timeline');
```

### Проблемы прямого импорта:

1. **Отсутствие контекста** - Timeline требует контексты Remotion
2. **Приватные зависимости** - Использует внутренние хелперы
3. **Нестабильность** - Может измениться в любой версии

## 4. Создание собственного Timeline

### Преимущества собственного Timeline:

- ✅ Полный контроль над функциональностью
- ✅ Кастомные стили и анимации
- ✅ Интеграция с вашими данными
- ✅ Стабильность API

### Ваш Timeline vs Studio Timeline:

| Функция | Ваш Timeline | Studio Timeline |
|---------|--------------|----------------|
| Drag & Drop | ✅ | ✅ |
| Кастомные стили | ✅ | ❌ |
| Интеграция данных | ✅ | ❌ |
| Зум | ✅ | ✅ |
| Горячие клавиши | ✅ | ✅ |
| Мультитрек | ✅ | ✅ |

## 5. Интеграция с Remotion Player

### Подход 1: Player + Ваш Timeline

```typescript
import React, { useState, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Timeline } from './Timeline'; // Ваш Timeline

const VideoEditor = () => {
  const playerRef = useRef<PlayerRef>(null);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Player
        ref={playerRef}
        component={MyComp}
        controls
        onTimeUpdate={(time) => setCurrentTime(time)}
      />
      <Timeline
        currentTime={currentTime}
        onTimeChange={(time) => playerRef.current?.seekTo(time * 30)}
      />
    </div>
  );
};
```

### Подход 2: Кастомный Studio

```typescript
import React from 'react';
import { StudioInternals } from '@remotion/studio/internals';

const CustomStudio = () => {
  return (
    <StudioInternals.Studio
      rootComponent={MyRoot}
      readOnly={false}
    />
  );
};
```

## 6. Лучшие практики

### Используйте конфигурацию для простых настроек:

```typescript
// remotion.config.ts
Config.setMaxTimelineTracks(30);  // Больше треков
Config.setKeyboardShortcutsEnabled(true);
```

### Создавайте собственный Timeline для сложной кастомизации:

```typescript
// Ваш Timeline с кастомными функциями
const MyTimeline = () => {
  return (
    <div className="custom-timeline">
      {/* Ваша реализация */}
    </div>
  );
};
```

### Используйте композиции для тестирования:

```typescript
// Root.tsx
<Composition
  id="Editor"
  component={EditorWithCustomTimeline}
  durationInFrames={900}
  fps={30}
  width={1920}
  height={1080}
/>
```

## 7. Примеры кода

### Пример 1: Конфигурация Studio

```typescript
// remotion.config.ts
import {Config} from '@remotion/cli/config';

Config.setMaxTimelineTracks(50);
Config.setKeyboardShortcutsEnabled(true);
Config.setStudioPort(3001);

Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    // Кастомные настройки
  };
});
```

### Пример 2: Интеграция Timeline

```typescript
// Editor.tsx
import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { Timeline } from './Timeline';

export const Editor = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <Player
          component={MyComp}
          inputProps={{ segments, currentTime }}
          controls
        />
      </div>
      <div style={{ height: '300px' }}>
        <Timeline
          segments={segments}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
        />
      </div>
    </div>
  );
};
```

## 8. Заключение

### Рекомендации:

1. **Для простых настроек** - используйте `remotion.config.ts`
2. **Для кастомизации UI** - создайте собственный Timeline
3. **Для интеграции** - используйте Player + ваш Timeline
4. **Не пытайтесь** импортировать Timeline из `@remotion/studio` напрямую

### Ваш проект уже реализует оптимальный подход:

- ✅ Собственный Timeline (`src/Timeline.tsx`)
- ✅ Интеграция с Player (`src/Editor.tsx`)
- ✅ Автономное тестирование (`src/StandaloneTimeline.tsx`)
- ✅ Конфигурация Studio (`remotion.config.ts`)

**Вывод**: @remotion/studio содержит Timeline, но лучше использовать собственную реализацию для максимального контроля! 