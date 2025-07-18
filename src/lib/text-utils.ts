/**
 * Подсчитывает количество визуальных символов в строке, корректно обрабатывая эмодзи
 * @param str Строка для подсчета символов
 * @returns Количество визуальных символов
 */
export const countVisualChars = (str: string) => {
  return Array.from(str.replace(/\n| /g, '')).length;
}; 