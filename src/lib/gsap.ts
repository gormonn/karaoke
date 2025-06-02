// GSAP инициализация и конфигурация
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Регистрируем все необходимые плагины
gsap.registerPlugin(SplitText);

// Экспортируем для использования в компонентах
export { gsap, SplitText };

// Можно добавить глобальные настройки GSAP если нужно
// gsap.defaults({ ease: "power2.out", duration: 1 }); 