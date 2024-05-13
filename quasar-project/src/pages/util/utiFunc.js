
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

export function pGColors() {
  return ['blue-grey',
  'blue-grey-5', //toSee
  'grey-10', //grey
  'brown',
  'deep-orange',
  'orange',
  'amber',
  //'yellow', //just ugly...see if could use suffix (7 to 10) for better look?
  'lime',
  'light-green',
  'green',
  'teal',
  'cyan',
  'light-blue',
  'blue',
  'indigo',
  'deep-purple',
  'purple',
  'pink',
  'red']
}