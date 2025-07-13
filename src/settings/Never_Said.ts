import { ANIMATION_MODE } from "../types";

export const SONG_SETTINGS = {
  NAME: "It's Not Clocking To You - Said No One Ever",
  DESCRIPTION: "",
  // test - fish text
  CREDITS: [
    "Special thanks to @never_said_official for the song",
    "Song: Never Said",
    "Artist: Never Said",
    "Album: Never Said",
    "Year: 2025",
    "Genre: Pop",
    "Length: 3:00",
    "BPM: 120",
  ],
  ANIMATIONS: {
    default: ANIMATION_MODE.ZOOM_IN,
    // todo: выгружать сюда мета-линии из converter.mjs
    metaLines: {
      // "[Verse 1]": ANIMATION_MODE.ZOOM_IN_BLUR,
      // "[Pre-Chorus 1]": ANIMATION_MODE.ZOOM_IN_BLUR,
       // в данном случае, достаточно указать только для chorus.
       // т.к. остальные анимации default
      "[Chorus 1]": ANIMATION_MODE.ZOOM_IN_OUT, // rename to disco
      "[Chorus 2]": ANIMATION_MODE.ZOOM_IN_OUT, // rename to disco
      // "[Verse 2]": ANIMATION_MODE.ZOOM_IN,
      // "[Bridge]": ANIMATION_MODE.LETTERIZE2,
      // "[Final Chorus]": ANIMATION_MODE.LETTERIZE2,
    }
  },
  IGNORE_CHAR_VIZ: ["[Chorus 1]", "[Chorus 2]", "[Bridge]"]
}

// todo: (done)(high) исправить проблему не подсвечивания слов в такт бита
//       проблема заключается в конфликте между animation.ts и use-char-viz.ts, а именно из-за filters
//       если например, не применять blur к буквам, которые еще не закончили появление - то это вероятно решит проблему, но не ясно как это будет выглядеть...
//       или например, не применять анимации in/out когда есть какие басы визуализировать...

// впизду! todo: (high) определять здесь edits (а не на уровне json, как предполагалось ранее)
// todo: (high) поправить вручную alignments - создать свой первый эдит
// done todo: (high) выровнять текст по центру экрана - попробовать https://www.remotion.dev/docs/layout-utils/
// todo: (low) попробовать https://www.remotion.dev/docs/layout-utils/
// todo: (mid) добавить волну в припев для визуализации музыки
// todo: (mid) откорректировать цвет (баланс черного) и добавить картинку с проверкой темных оттенков на экране 
// todo: (mid) реализовать эффекты для концепции 2 (свет в конце туннеля)
// todo: (mid) реализовать эффекты для концепции 3 (свет с титрами)
// todo: (mid) нарастить durationInFrames чтобы была возможность сделать финальный эффект
// todo: (mid) заюзать https://www.remotion.dev/docs/captions/

// провести оценку

// todo: (mid-high) обязательно вынести параметры анимации сюда. унифицировать создание новых анимаций - все это сложно поддерживать и не удобно пиздец
// todo: (low) разделить на 2 анимации / вход и выход - а то уже сложно комбинировать
// todo: (low) создавать файл после завершения converter.mjs
// todo: (low) перенести stems сюда
// todo: (low) переделать metaLines в json на строку, вместо массива
// todo: (low) прикрутить wishper https://www.remotion.dev/docs/install-whisper-cpp/ | https://www.remotion.dev/docs/openai-whisper/


// 
// концепция 1: мы движемся по корридору, и градиенты приближаются к нам
//  - при этом, мы не видим вдали эти градиенты, они как бы "возникают возле нас"
//  - возможно стоит привязать их появление к конкретным словам песни
// концепция 2: к концу песни мы видим свет в конце туннеля и в итоге все превращается в свет
//  - свет вконце туннеля можно сделать круглым
//  - реализовать маску, которая будет повторять очертания белого круга и менять окружение,
//    включая цвета символов
// концепция 3: после того, как мы оказываемся на белом фоне, запустить титры, в которых поблагодарить:
//  - создателей мемов по say no one ever
//  - джастина Бибера, за его фразу it's not clocking to you
//  - создателей мемов про I'm not clocking to you
//  - создателей suno
//  - создателей claude
//  - создателя remotion и в особенности форка karaoke (хз стоит ли писать об этом)
//  - создателей cursor ide
//  либо просто сказать спасибо всем, кто помог сделать этот проект (ну как бы в соло, не считая инструменты и мемы)
//  возможно стоит сказать что все в соло по мотивам мемов
//  добавить в титры превью футболок, которые можно купить
//  либо просто перечислить инструменты, которые использовались для создания этого проекта
//  вконце написать спасибо за просмотр!
//  и в самом конце добавить плашку с подпиской, лайком и колокольчиком