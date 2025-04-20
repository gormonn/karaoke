import Letterize from "https://cdn.skypack.dev/letterizejs@2.0.0"; 
import { 
  stagger,
  createTimeline,
  utils, 
 } from "https://cdn.skypack.dev/animejs@4.0.0";
 

const createAnimation = (
  selector,
  type,
  {
    duration = 400, 
    charTranslateY = 24,
  } = {}
) => {
  const isOut = type === 'out';
  const targets = `${selector}.${type}`;

  const text = new Letterize({
    targets
  }); 

  const animation = createTimeline({
    defaults: {
      duration,
      easing: 'easeInOutQuad', 
      delay: stagger(duration / 10),
    }, 
    autoplay: true,
   
  }).add(text.listAll, {delay: 1000});
  
  if(isOut){
    animation.add(text.listAll, {
      translateY: { from: '0px', to: `${charTranslateY}px` },
      rotateX: { from: '0deg', to: '90deg' },
      filter: { from: 'blur(0px)', to: 'blur(4px)' },
      opacity: { from: 1, to: 0 },
      color: {from: 'rgb(255, 255, 255)', to: 'rgb(0, 0, 0)'}, 
    }) 
  }else{
    animation.add(text.listAll, {
      translateY: { from: `-${charTranslateY}px`, to: '0px' },
      rotateX: { from: '-90deg', to: '0deg' },
      filter: { from: 'blur(4px)', to: 'blur(0px)' },
      opacity: { from: 0, to: 1 }, 
      color: {from: 'hsl(109, 97%, 88%)', to: 'hsl(350, 46%, 47%)'}, 
    }) 
  }

  return animation
}

const inAnimation = createAnimation('.text', 'in');
const outAnimation = createAnimation('.text', 'out');

inAnimation.play();
outAnimation.play();

const [ $pauseButton ] = utils.$('.pause');
const [ $playButton ] = utils.$('.play');
const [ $restartButton ] = utils.$('.restart');
const pauseTimeline = () => {
  inAnimation.pause();
  outAnimation.pause()
};
const playTimeline = () => {
  inAnimation.resume();
  outAnimation.resume();
};
const restartTimeline = () => {
  inAnimation.restart();
  outAnimation.restart();
};


$pauseButton.addEventListener('click', pauseTimeline);
$playButton.addEventListener('click', playTimeline);
$restartButton.addEventListener('click', restartTimeline);