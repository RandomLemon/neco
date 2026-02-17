import { onMounted, ref } from 'vue'


type DateRange = {
  from: string,
  to: string
}

type HookPosition = 'left' | 'right'

interface LanternOptions {
  numLanterns?: number
  date?: DateRange
  position?: {
    zIndex?: number
    offsetX?: string[]
    offsetY?: string[]
    hook?: HookPosition[]
  }
  content?: string[]
}

const error = 'color: #F56C6C; font-weight: bold;'
const info = 'color: white; font-weight: normal;'

const random = (l: number, r: number): number => {
  return Math.floor(Math.random() * (r - l + 1)) + l
}

const dateCheck = (date: string) => {
  const [month, day] = date.split('-').map(Number)

  if (month < 1 || month > 12) {
    console.error(`%c[Lantern]: %cError: Invalid month.`, error, info)
    return false
  }

  if (day < 1 || day > 31) {
    console.error(`%c[Lantern]: %cError: Invalid day.`, error, info)
    return false
  }

  return true
}

const timeInRange = (date: DateRange | undefined) => {
  if (date === undefined) {
    return false
  }
  const [fromMonth, fromDay] = date.from.split('-').map(Number)
  const [toMonth, toDay] = date.to.split('-').map(Number)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  if (fromMonth > toMonth) {
    if (currentMonth > fromMonth || currentMonth < toMonth) {
      return true
    } else {
      if (currentMonth === fromMonth) {
        return currentDay >= fromDay
      } else if (currentMonth === toMonth) {
        return currentDay <= toDay
      }
    }
  } else {
    if (currentMonth > fromMonth && currentMonth < toMonth) {
      return true
    } else {
      if (currentMonth === fromMonth && currentMonth !== toMonth) {
        return currentDay >= fromDay
      } else if (currentMonth === toMonth && currentMonth !== fromMonth) {
        return currentDay <= toDay
      } else if (currentMonth === fromMonth && currentMonth === toMonth) {
        return currentDay >= fromDay && currentDay <= toDay
      }
    }
  }

  return false
}

class Lantern {
  options = {
    lantern: {
      numLanterns: 4,
      date: {
        from: '1-1',
        to: '3-12'
      },
      position: {
        zIndex: 1024,
        offsetX: ['0px', '150px', '150px', '0'],
        offsetY: ['0px', '0px', '0px', '0px'],
        hook: ['left', 'left', 'right', 'right']
      },
      content: ['新', '年', '快', '乐']
    }
  }

  #parseDate(date: DateRange | undefined): void {
    if (date === undefined) {
      return
    }
    if (date.from && dateCheck(date.from)) {
      this.options.lantern.date.from = date.from
    }
    if (date.to && dateCheck(date.to)) {
      this.options.lantern.date.to = date.to
    }
  }

  #parsePosition(options: LanternOptions): void {
    if (options.position === undefined) {
      return
    }
    if (options.position.zIndex) {
      this.options.lantern.position.zIndex = options.position.zIndex
    }
    if (options.position.offsetX) {
      this.options.lantern.position.offsetX = options.position.offsetX
      if (options.position.offsetX.length < this.options.lantern.numLanterns) {
        for (let i = options.position.offsetX.length; i < this.options.lantern.numLanterns; ++i) {
          this.options.lantern.position.offsetX.push('0px')
        }
      }
    }
    if (options.position.offsetY) {
      this.options.lantern.position.offsetY = options.position.offsetY
      if (options.position.offsetY.length < this.options.lantern.numLanterns) {
        for (let i = options.position.offsetY.length; i < this.options.lantern.numLanterns; ++i) {
          this.options.lantern.position.offsetY.push('0px')
        }
      }
    }
    if (options.position.hook) {
      this.options.lantern.position.hook = options.position.hook
      if (options.position.hook.length < this.options.lantern.numLanterns) {
        for (let i = options.position.hook.length; i < this.options.lantern.numLanterns; ++i) {
          this.options.lantern.position.hook.push('0px')
        }
      }
    }
  }

  #parseContent(options: LanternOptions): void {
    if (!options.content) {
      return
    }
    this.options.lantern.content = options.content
    if (options.content?.length < this.options.lantern.numLanterns) {
      for (let i = options.content.length; i < this.options.lantern.numLanterns; ++i) {
        this.options.lantern.content.push('')
      }
    }
  }

  #overwriteDefaults(options: LanternOptions): void {
    if (options.numLanterns) {
      this.options.lantern.numLanterns = options.numLanterns
    }
    this.#parseDate(options.date)
    this.#parsePosition(options)
    this.#parseContent(options)
  }

  #parseHTML(): string {
    const lanternDivs = []
    const lanternCSS = []
    for (let i = 0; i < this.options.lantern.numLanterns; ++i) {
      lanternDivs.push(`
        <div class="lantern-box lantern-box${i}">
          <div class="lantern-box-inner">
            <div class="lantern-chain">
              <img class="lantern-image" src="/UI/chain.png" alt="chain" />
            </div>
            <div class="lantern-body">
              <img class="lantern-image" src="/UI/lantern.png" alt="lantern" />
              ${this.options.lantern.content[i].trim() === '' ? '' : '<span class="lantern-text">' + this.options.lantern.content[i] + '</span>'}
            </div>
          </div>
        </div>
      `)
      lanternCSS.push(`
        .lantern-box${i} {
          position: absolute;
          top: ${this.options.lantern.position.offsetY[i]};
          ${this.options.lantern.position.hook[i]}: ${this.options.lantern.position.offsetX[i]};
          z-index: ${this.options.lantern.position.zIndex};
          transform-origin: top ${this.options.lantern.position.hook[i]};
        }
        .lantern-box${i} .lantern-box-inner {
          animation: swing ${random(3, 4)}s infinite ease-in-out;
        }
        .lantern-box${i} .lantern-body {
          animation: swing ${random(4, 5)}s infinite ease-in-out;
        }
      `)
    }
    const lanternDivsHTML = lanternDivs.join('')
    const lanternCSSHTML = lanternCSS.join('')
    return `
      <div class="lantern-container">
        ${lanternDivsHTML}
      </div>
      <style type="text/css">
      .lantern-container {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .lantern-box {
        pointer-events: none;
        user-select: none;
        transform: scale(2)
      }
      .lantern-box-inner {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        transform-origin: top center;
      }
      .lantern-image {
        image-rendering: pixelated;
      }
      .lantern-chain, .lantern-body {
        transform-origin: top center;

        display: flex;
        height: min-content;
        width: min-content;
        padding: 0;
        margin: 0;
      }
      .lantern-chain, lantern-text {
        z-index: ${this.options.lantern.position.zIndex + 1};
      }
      .lantern-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        filter:
          drop-shadow(0 0 32px rgba(216, 0, 15, 0.8))
          drop-shadow(0 0 16px #d8000f)
          drop-shadow(0 0 8px #fa6c00);
      }
      .lantern-text {
        height: 24px;
        width: 24px;
        text-align: center;
        margin-top: 4px;
        background-color: #fa6c00;
        border-radius: 50%;
      }
      @keyframes swing {
        0% {-moz-transform: rotate(-10deg);}
        50% {-moz-transform: rotate(10deg);}
        100% {-moz-transform: rotate(-10deg);}
      }
      ${lanternCSSHTML}
      </style>
    `
    .replace(/\s+/g, ' ')
    .trim()
  }

  constructor(containerId: string, options: LanternOptions = {}) {
    this.#overwriteDefaults(options)

    const container: HTMLElement | null = document.getElementById(containerId)
    if (container === null) {
      return
    }
    const isInTimeRange = timeInRange(this.options.lantern.date)
    container.innerHTML = isInTimeRange ? this.#parseHTML() : ''
  }
}

/**
 *
 * @param containerId ID of the container element
 * @param options The options for the lantern
 *
 * @example
 * ```ts
 * interface LanternOptions {
 *   // How many lanterns to display
 *   numLanterns?: number
 *   // Display the lanterns during the specified date range
 *   date?: {
 *     // Day of a year, e.g. '12-25', '1-1'
 *     from: string
 *     // Day of a year, e.g. '12-25', '1-1
 *     to: string
 *   }
 *   // Position of the lantern
 *   position?: {
 *     // z-index for the lantern
 *     zIndex?: number
 *     // The horizontal offset of the lantern
 *     offsetX?: string[]
 *     // The vertical offset of the lantern
 *     offsetY?: string[]
 *     // The horizontal alignment of the lantern ('left' | 'right')
 *     hook?: HookPosition[]
 *   }
 *   // Words for every single lantern, can be HTML element
 *   content?: string[]
 * }
 * ```
 * @returns The lantern instance
 */
export function useLantern(containerId: string, options: LanternOptions) {
  const lanternInstance = ref<Lantern | null>(null)

  onMounted(() => {
    lanternInstance.value = new Lantern(containerId, options)
  })

  return lanternInstance
}
