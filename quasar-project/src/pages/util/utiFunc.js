
export function applyClasses (event, type) {
    const isHeader = type === 'header'
    return {
      [ `text-white bg-${ event.bgcolor.toLocaleLowerCase() }` ]: true, //adding toLocaleLowerCase() to account for colors with uppercased first letter
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