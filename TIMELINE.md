# Таймлайн караоке

Компонент `Timeline` автоматически создает треки на основе данных `words` из `Segment`. Это позволяет визуализировать и редактировать временные метки слов в караоке.

## Особенности

- **Автоматическое создание треков**: На основе сегментов и строк из данных
- **Визуальное отображение**: Каждое слово представлено в виде блока на временной шкале
- **Интерактивность**: Перетаскивание блоков для изменения временных меток
- **Навигация по времени**: Клик по временной шкале для перехода к нужному моменту
- **Подсветка активных слов**: Текущие слова подсвечиваются золотым цветом

## Использование

### Базовый пример

```tsx
import {Timeline} from './Timeline';
import {segments} from './data';

const MyComponent = () => {
  const [currentTime, setCurrentTime] = useState(0);
  
  return (
    <Timeline
      segments={segments}
      currentTime={currentTime}
      onTimeChange={setCurrentTime}
      onItemUpdate={(itemId, newStart, newEnd) => {
        console.log(`Обновлено: ${itemId}, ${newStart}s-${newEnd}s`);
      }}
    />
  );
};
```

### Интеграция с Remotion Player

```tsx
import React, {useRef, useEffect, useState} from 'react';
import {Player, PlayerRef} from '@remotion/player';
import {Timeline} from './Timeline';

const VideoEditor = () => {
  const playerRef = useRef<PlayerRef>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [segments, setSegments] = useState([]);
  const fps = 30;

  // Отслеживание фреймов Player
  useEffect(() => {
    if (!playerRef.current) return;

    const handleFrameUpdate = (e: any) => {
      setCurrentFrame(e.detail.frame);
    };

    playerRef.current.addEventListener('frameupdate', handleFrameUpdate);
    
    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener('frameupdate', handleFrameUpdate);
      }
    };
  }, []);

  const handleTimeChange = (time: number) => {
    const frame = Math.round(time * fps);
    setCurrentFrame(frame);
    
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Player сверху */}
      <div style={{ flex: 1 }}>
        <Player
          ref={playerRef}
          component={MyComposition}
          fps={fps}
          durationInFrames={900}
          compositionWidth={1280}
          compositionHeight={720}
          controls
        />
      </div>

      {/* Timeline снизу */}
      <div style={{ height: '400px' }}>
        <Timeline
          segments={segments}
          currentTime={currentFrame / fps}
          onTimeChange={handleTimeChange}
          onItemUpdate={(id, start, end) => {
            // Обновить данные segments
          }}
        />
      </div>
    </div>
  );
};
```

### Демо компоненты

В проекте включены два демо компонента:

**Editor** - Полноценный редактор с интегрированным Remotion Player:
```tsx
import {Editor} from './Editor';

// Доступен как композиция "Editor" в Remotion Studio
// Player сверху + Timeline снизу с синхронизацией
```

**StandaloneTimeline** - Автономный таймлайн без Player:
```tsx
import {StandaloneTimeline} from './StandaloneTimeline';

// Доступен как композиция "StandaloneTimeline" в Remotion Studio
// Только Timeline с простыми элементами управления
```

## API

### Props компонента Timeline

| Prop | Тип | Описание |
|------|-----|----------|
| `segments` | `Segment[]` | Массив сегментов с данными о словах |
| `currentTime?` | `number` | Текущее время воспроизведения (в секундах) |
| `onTimeChange?` | `(time: number) => void` | Коллбек при изменении времени |
| `onItemUpdate?` | `(itemId: string, newStart: number, newEnd: number) => void` | Коллбек при изменении временных меток слова |

### Типы данных

```tsx
interface TimelineItem {
  id: string;
  word: string;
  start: number;
  end: number;
  segmentId: number;
  lineIndex?: number;
  probability: number;
}

interface TimelineTrack {
  id: string;
  name: string;
  items: TimelineItem[];
}
```

## Структура треков

Таймлайн автоматически создает следующие типы треков:

1. **Основные треки сегментов**: Содержат все слова из `segment.words`
2. **Треки строк**: Если есть `segment.lines`, создаются отдельные треки для каждой строки

### Пример структуры данных

```json
{
  "segments": [
    {
      "id": 0,
      "words": [
        {"word": "Hello", "start": 1.0, "end": 1.5},
        {"word": "world", "start": 1.6, "end": 2.0}
      ],
      "lines": [
        [
          {"word": "Hello", "start": 1.0, "end": 1.5}
        ],
        [
          {"word": "world", "start": 1.6, "end": 2.0}
        ]
      ]
    }
  ]
}
```

## Визуальные особенности

- **Активные слова**: Золотой цвет (#FFD700) с эффектом свечения
- **Обычные слова**: Синий цвет (#4A90E2)
- **Временная шкала**: Метки каждые 5 секунд
- **Индикатор времени**: Красная линия показывает текущее время
- **Масштаб**: 50 пикселей на секунду

## Интерактивность

### Перетаскивание слов
- Нажмите и удерживайте блок слова
- Перетащите в новую позицию
- Длительность слова сохраняется

### Навигация по времени
- Кликните по временной шкале
- Используйте коллбек `onTimeChange`

### Обновление данных
- Коллбек `onItemUpdate` вызывается при изменении
- Обновите исходные данные в родительском компоненте

## Расширение функциональности

### Добавление новых типов треков

```tsx
const createCustomTracks = (segments: Segment[]): TimelineTrack[] => {
  // Ваша логика создания треков
  return customTracks;
};
```

### Кастомная визуализация

```tsx
const CustomTimelineItem = ({ item, isActive }) => {
  return (
    <div style={{
      backgroundColor: isActive ? 'gold' : 'blue',
      // ваши стили
    }}>
      {item.word}
    </div>
  );
};
```

## Производительность

- Используется `useMemo` для оптимизации вычислений
- Минимальные перерендеры при изменении времени
- Эффективное обновление только измененных элементов

## Совместимость

- Работает с данными формата Whisper
- Поддерживает как `words`, так и `lines` массивы
- Совместим с существующей структурой проекта караоке 