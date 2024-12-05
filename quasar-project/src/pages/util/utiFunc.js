import { colors } from 'quasar'

const { getPaletteColor } = colors  //just to deal with these colors smh too much?!?

export function applyClasses (event, type) {
    const isHeader = type === 'header'
    const bgC = event.bgcolor ? 'bg-'+event?.bgcolor?.toLocaleLowerCase() : 'bg-black'  //oldie >> bg-${ event?.bgcolor?.toLocaleLowerCase() }`
    return {
      [ `text-white ${bgC}` ]: true, // >>account for colors with uppercased first letter..could also add # between 1 & 14 added at end...toSee**
      'full-width': !isHeader && (!event.side || event.side === 'full'),
      'left-side': !isHeader && event.side === 'left',
      'right-side': !isHeader && event.side === 'right',
      'rounded-border': true
    }
}

export function applyStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
    const s = {}
    if (timeStartPos && timeDurationHeight) {
      s.top = timeStartPos(event.time) + 'px'
      s.height = timeDurationHeight(event.duration) + 'px'
    }
    s[ 'align-items' ] = 'flex-start'
    return s
  }

export function hexColor(c) {
  return getPaletteColor(c)
}

export function pGColors() {
  return [
    'deep-orange',
    'orange',
    'amber',
    'blue-grey',
    //'blue-grey-5', //very close to above
    'grey-10', //grey
    'brown',
    //'yellow', //just ugly...see if could use suffix (7 to 10) for better look?
    //'yellow-8', //still too close to amber and orange
    'lime',
    'light-green',
    'green-10',
    'teal',
    'cyan',
    'light-blue-3', //oldie >> light-blue
    'blue',
    'indigo',
    'deep-purple-14', //'deep-purple',
    'purple',
    'pink',
    'red']
}

export function deepCopy(obj) { //deep copy object
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  }

  const copied = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copied[key] = deepCopy(obj[key]);
    }
  }

  return copied;
}

export function whenFrmtTime(timey){
  //let when = (timey) => {
  if(!timey) return ''
  
  let o = timey.split(':')
  return parseInt(o[0]) >= 12 ? timey+" PM" : timey+" AM" 
    //}

}

export function parseScore(t){
  const tokens = t.split(/on/) 
  if (tokens.length != 2) {//should be at most two variables....
    //console.log(`parseScore error? >>${t}`, tokens)  
    return -89 //guardrails to distinguish with potensh error below*** could still fail with 'one' though smh..toReview***
  }
  //console.log(`parseScore for ${t}`, tokens)
  return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!
}

export function doLog(mess,...data){
  for (let arg of data){//sum += arg;
    console.log(mess, arg ? JSON.parse(JSON.stringify(arg)) : '')
  } 
  //console.log(mess, data ? JSON.parse(JSON.stringify(data)) : '')
}