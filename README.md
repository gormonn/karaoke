# Караоке с кастомным Timeline

Этот проект демонстрирует как создать кастомный Timeline для Remotion Studio без использования платного пакета `@remotion/studio`.

## Возможности

- ✅ Кастомный Timeline с поддержкой drag-and-drop
- ✅ Интеграция с Remotion Player
- ✅ Редактирование временных меток слов
- ✅ Визуализация сегментов и строк
- ✅ Синхронизация с аудио воспроизведением
- ✅ **НОВОЕ**: Полная интеграция GSAP с Remotion для плавных анимаций

## Структура проекта

```
src/
├── Timeline.tsx          # Кастомный Timeline компонент
├── Editor.tsx           # Редактор с интеграцией Player + Timeline
├── StandaloneTimeline.tsx # Автономный Timeline для тестирования
├── MyComp.tsx           # Основная композиция для рендеринга
├── Root.tsx             # Корневой компонент с композициями
├── lib/
│   ├── gsap.ts          # GSAP интеграция с Remotion
│   └── gsap-example.tsx # Примеры использования GSAP
└── types.ts             # Типы данных
```

## Запуск проекта

### 1. Remotion Studio (с кастомным Timeline)
```bash
npm run start
```

### 2. Автономный Timeline
```bash
# Откройте в браузере src/StandaloneTimeline.tsx
```

### 3. Редактор с интеграцией
```bash
# Выберите композицию "Editor" в Remotion Studio
```

## GSAP + Remotion Интеграция

Проект включает полную интеграцию GSAP с Remotion для создания плавных анимаций, синхронизированных с timeline.

### Основные возможности:
- ✅ Полная синхронизация GSAP анимаций с `useCurrentFrame()`
- ✅ Поддержка всех GSAP функций (timelines, tweens, easing)
- ✅ Интеграция с SplitText для посимвольной анимации
- ✅ Отсутствие мерцания при рендеринге
- ✅ Оптимизация для многопоточного рендеринга Remotion

### Быстрый старт:
```typescript
import { useGsapTimeline } from './lib/gsap';

const MyComponent = () => {
  const animationRef = useGsapTimeline(() => {
    return gsap.timeline()
      .fromTo('.word', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 })
      .to('.word', { color: '#FFD700', scale: 1.2, duration: 0.5 });
  });

  return (
    <div ref={animationRef}>
      <span className="word">Анимированный текст</span>
    </div>
  );
};
```

### Документация:
- 📖 [Полная документация](GSAP-REMOTION-INTEGRATION.md)
- 🎯 [Примеры использования](src/lib/gsap-example.tsx)

## Кастомизация Timeline

### Основные настройки в `src/Timeline.tsx`:

```typescript
// Константы для UI
const TRACK_HEIGHT = 60;
const ITEM_MIN_WIDTH = 20;
const TIMELINE_SCALE = 50; // пикселей на секунду
const TIMELINE_PADDING = 20;
```

### Добавление новых функций:

1. **Новые треки**: Модифицируйте `createTracksFromSegments()`
2. **Кастомные элементы**: Обновите `TimelineItemComponent`
3. **Новые события**: Добавьте обработчики в `Timeline`

## Альтернативы платному @remotion/studio

### 1. Собственная реализация (текущий подход)
- ✅ Полный контроль над функциональностью
- ✅ Бесплатно
- ❌ Требует больше разработки

### 2. Сторонние библиотеки
- `@xzdarcy/react-timeline-editor`
- `video-editing-timeline`
- `@pansyjs/video-editing-timeline`

### 3. Интеграция с Remotion Player
```typescript
// Пример интеграции
const MyEditor = () => {
  return (
    <div>
      <Player component={MyComp} {...props} />
      <CustomTimeline onTimeChange={handleTimeChange} />
    </div>
  );
};
```

## Конфигурация Remotion

В `remotion.config.ts` настроены:
- Увеличенное количество треков Timeline
- Кастомные алиасы для компонентов
- Оптимизация для разработки

## Типы данных

```typescript
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

## Функции Timeline

- **Drag & Drop**: Перетаскивание элементов для изменения времени
- **Масштабирование**: Изменение масштаба временной шкалы
- **Мультитрек**: Поддержка нескольких треков
- **Синхронизация**: Автоматическая синхронизация с Player

## Дальнейшее развитие

1. Добавить зум Timeline
2. Реализовать выделение нескольких элементов
3. Добавить горячие клавиши
4. Интегрировать с системой отмены/повтора
5. Добавить экспорт/импорт конфигурации
6. **GSAP**: Расширить библиотеку анимаций для караоке
7. **GSAP**: Добавить предустановленные эффекты появления/исчезновения текста

## Поддержка

При возникновении вопросов:
1. Изучите код в `src/Timeline.tsx`
2. Проверьте примеры в `src/Editor.tsx`
3. Протестируйте на `src/StandaloneTimeline.tsx`

# Remotion video

A demo on how to create a karaoke video with Remotion.

Install Whisper from GitHub and run `node sub.mjs` to generate subtitles. The rest is automatic! (Except the song title at the bottom)

https://github.com/JonnyBurger/karaoke/assets/1629785/a8a5739c-ca28-46eb-aa23-7ce841d256cc



<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.gif">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm start
```

**Render video**

```console
npm run build
```

**Upgrade Remotion**

```console
npm run upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
