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
      "[Verse 1]": ANIMATION_MODE.ZOOM_IN,
      "[Pre-Chorus]": ANIMATION_MODE.ZOOM_IN,
       // в данном случае, достаточно указать только для chorus.
       // т.к. остальные анимации default
      "[Chorus]": ANIMATION_MODE.ZOOM_IN_OUT,
      "[Verse 2]": ANIMATION_MODE.ZOOM_IN,
      "[Bridge]": ANIMATION_MODE.ZOOM_IN,
      "[Final Chorus]": ANIMATION_MODE.ZOOM_IN,
    }
  },
  IGNORE_CHAR_VIZ: ["[Chorus]"]
}

// todo: (high) определять здесь edits (а не на уровне json, как предполагалось ранее)
// todo: (high) выровнять текст по центру y
// todo: (mid) добавить волну в припев для визуализации музыки
// todo: (mid) нарастить durationInFrames чтобы была возможность сделать финальный эффект
// todo: (mid) создавать файл после завершения converter.mjs
// todo: (low) перенести stems сюда
// todo: (low) переделать metaLines в json на строку, вместо массива


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