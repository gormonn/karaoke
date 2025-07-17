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
  IGNORE_CHAR_VIZ: ["[Chorus 1]", "[Chorus 2]", "[Bridge]"],
  interpolationMetaLines: ["[Chorus 1]", "[Chorus 2]"],
  // на основе sedgmentId-wordId из финального объекта (finalSubs)
  ignoreInterpolateList: new Set([
    // '0-5', // 2 am hz

    '2-10', '2-11','2-13',

    // '3-0', // while
    // '3-1', // you
    // '3-2', // nod
    '3-5', '3-6', '3-10', '3-11', '3-12',
    
    // (Chorus 1)
    // '53-0', // its 
    // '54-0', // not 
    // '55-0', // clocking 
    // '56-0', // to
    // '57-0', // you
    // '58-0', // that
    // '59-0', // im
    // '60-0', // already
    // '61-0', // gone
    // (Chorus 1)

    '4-0',
    // '4-1',
    // '4-2',
    '4-3',
    // '4-4',
    '4-5',
    // '4-6',
    
    '5-0',
    '5-1',
    '5-2',
    // '5-3',
    '5-4',
    '5-5',
    // '5-6',

    '11-8', // ining (beat)
    // '11-11', // you (beat)

    '14-3', '14-4', '14-5', 

    '15-0',
    '15-1',
    '15-2',
    '15-3',
    '15-4',
    '15-5',
    '15-6',

    '16-0',
    '16-1',
    '16-2',
    '16-3',
    '16-4',
    '16-5',

    '22-0',
    '22-1',
    '22-2',
    '22-3',
    '22-4',
    '22-5',
    '22-6',
    '22-7',
    '22-8',
    '22-9',
    '22-10',
    '22-11',
    '22-12',
    '22-13',
    '22-14',

    '23-4', // forever
    '23-5', // with
    '23-6', // that
    '23-7', // tone

    '23-8', // i
    '23-9', // already
    '23-10', // gone
    '23-11', // gone
    '23-12', // gone
    '23-13', // gone
    '23-14', // gone
    // '23-16',
    '23-17',

    // '24-0',
    // '24-1',
    // '24-2',
    // '24-3',
    // '24-4',
    // '24-5',
    // '24-6',
    // '24-7',
    // '24-8',
    // '24-9',
    // '24-10',
    // '24-11',
    // '24-12',
    // '24-13',
    // [Final Chorus]
    '25-2', // just a
    // '25-3', // phase
    '25-4', // we
    '25-5', // 're
    // '25-6', // going
    // '25-8', // said
    // '25-9', // no 
    // '25-10', // one
    // '25-11'
    
    // '25-10', // a
    // '25-11', // phase
    // '25-12', // we're

    // [Final Chorus]
    '26-0', // it's
    '26-4', // to
    '26-5', // you
    '26-12', // started
  ]),
  lights: ["[Chorus 1]", "[Chorus 2]"]
}

// minimal todo:
// already gone



// - fix "This relationship means everything to me"
// - fix We should talk about future (в последнюю очередь)
// - (ok) checking out
// - clocking to you that im already gone
// - "I just need space to find myself"
// - already found something more
// - clocking
// - goodbye note




// todo: 
//      "start": null,
//      "end": null,
// в сегментах игнорируются...
// сейчас учитываются только start и end от words

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
// done: (low) прикрутить wishper https://www.remotion.dev/docs/install-whisper-cpp/ | https://www.remotion.dev/docs/openai-whisper/

// todo: (low) подумать над оптимизацией файлов json без дублирования words



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