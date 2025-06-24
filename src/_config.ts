import { staticFile } from "remotion"

export const SONG_NAME = '3\. First Light'

export const SONG_TARGET = {
  segments: staticFile(`${SONG_NAME}-converted.json`),
  music: staticFile(`${SONG_NAME}.mp3`),
  background: staticFile('assets/background.jpg')
}
