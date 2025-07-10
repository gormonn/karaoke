# Режимы анимации символов в караоке

## Обзор

Добавлены два режима анимации для символов в караоке:

1. **`default`** - стандартный режим с подсветкой и масштабированием
2. **`letterize`** - новый режим, адаптированный из Word.tsx с 3D эффектами

## Настройка

### Глобальная настройка в конфигурации

```typescript
// В src/_config.ts
export const KARAOKE_CONFIG = {
  // Выбор режима анимации
  animationMode: 'letterize' as 'default' | 'letterize',
  
  // Настройки для режима "letterize"
  letterizeAnimation: {
    charTranslateY: 24,          // Смещение символов по вертикали
    duration: 0.4,               // Длительность анимации (сек)
    easing: 'power2.inOut',      // GSAP easing
    blur: {
      from: 4,                   // Начальное размытие
      to: 0,                     // Конечное размытие
    },
    rotation: {
      from: -90,                 // Начальный поворот (градусы)
      to: 0,                     // Конечный поворот (градусы)
    },
    colors: {
      from: 'hsl(109, 97%, 88%)', // Начальный цвет
      to: 'hsl(350, 46%, 47%)',   // Конечный цвет
    },
  },
};
```

### Локальная настройка в компоненте

```typescript
// В src/Composition.tsx
const ANIMATION_MODE: 'default' | 'letterize' = 'letterize';

<Subtitles 
  src={SONG_TARGET.segments} 
  useAutoLines={USE_AUTO_LINES} 
  animationMode={ANIMATION_MODE}
/>
```

## Описание режимов

### Default режим
- Плавное изменение цвета с золотистого на белый
- Масштабирование символов (1.15x)
- Эффект текстовой тени с подсветкой
- Быстрые переходы (0.1 сек)

### Letterize режим
- 3D поворот символов по оси X (от -90° до 0°)
- Вертикальное движение символов
- Размытие в начале (4px → 0px)
- Плавный переход цвета
- Настраиваемая длительность анимации

## Пример использования

```typescript
// Стандартный режим
<SegmentComp 
  segment={segment} 
  animationMode="default" 
/>

// Режим с 3D эффектами
<SegmentComp 
  segment={segment} 
  animationMode="letterize" 
/>
```

## Кастомизация

Вы можете настроить параметры анимации в `src/_config.ts`:

- `charTranslateY` - высота подъема символов
- `duration` - скорость анимации
- `easing` - функция плавности
- `blur` - параметры размытия
- `rotation` - углы поворота
- `colors` - цвета начала и конца

## Совместимость

- Работает с обоими режимами разбивки: `useAutoLines` и обычным
- Поддерживает все существующие функции караоке
- Обратно совместим с предыдущими версиями 