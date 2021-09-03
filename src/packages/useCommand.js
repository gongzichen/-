import deepcopy from 'deepcopy'
import { onUnmounted } from '@vue/runtime-core'
import { events } from './events'

// 撤销 前进
export function useCommand(data) {
  const state = {
    // 前进 后退 指针
    current: -1, // 前进 后台 索引值
    queue: [], // 存放所有操作指令
    commands: {}, // 制作命令 ： 执行功能映射
    commandArray: [], // 存放所有命令
    destroyArray: []
  }

  const registry = (command) => {
    state.commandArray.push(command)
    state.commands[command.name] = () => {
      const { redo, undo } = command.executed()
      redo()
      if (!command.pushQueue) {
        return
      }
      let { queue, current } = state

      // 栈结构 组件1 =》 组件2 =》 组件3 =》 组件4
      // 组件1 =》 组件3
      if (queue.length > 0) {
        queue = queue.slice(0, current + 1)
        state.queue = queue
      }
      queue.push({ redo, undo }) // 保存指令
      state.current = current + 1
      console.log(queue)
    }
  }

  // 前进
  registry({
    name: 'redo',
    keyboard: 'ctrl+y',
    execute() {
      return {
        redo() {
          let item = state.queue[state.current + 1]
          if (item) {
            item.redo && item.redo()
            state.current++
          }
        }
      }
    }
  })

  // 撤销
  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    execute() {
      return {
        undo() {
          if (state.current === -1) return // 没有可以撤销
          let item = state.queue[state.current] // 上一步
          if (item) {
            item.undo && item.undo()
            state.current--
          }
        }
      }
    }
  })

  registry({
    name: 'drag',
    pushQueue: true,
    init() {
      // 初始化操作， 默认执行
      this.before = null
      // 监控拖拽事件  保存状态
      const start = () => {
        this.before = deepcopy(data.value.blocks)
      }

      const end = () => {
        state.commands.drag()
      }

      events.on('start', start)
      events.on('end', end)
      return () => {
        events.off('state', start)
        events.off('end', end)
      }
    },
    execute() {
      let before = this.before
    }
  })

  const keyboardEvent = (() => {
    // 虚位键码
    const keyCodes = {
      90: 'z',
      89: 'y'
    }
    const onKeydown = (e) => {
      const { ctrlKey, keyCode } = e
      let keyString = []
      if (ctrlKey) keyString.push('ctrl')
      keyString.push(keyCodes[keyCode])
      keyString = keyString.join('+')

      state.commandArray.forEach(({ keyboard, name }) => {
        if (!keyboard) return // 没有键盘
        if (keyboard === keyString) {
          state.command[name]()
          e.preventDefault()
        }
      })
    }
    // 初始化事件
    const init = () => {
      window.addEventListener('keydown', onKeydown)

      // 返回销毁事件
      return () => {
        // 销毁事件
        window.removeEventListener('keydown', onKeydown)
      }
    }
    return init
  })()(
    // 监听键盘事件
    () => {
      // 键盘事件
      state.destroyArray.push(keyboardEvent())
      state.commandArray.forEach(
        (command) => command.inti && state.destroyArray.push(command.init())
      )
    }
  )()

  // 组件销毁时 取消绑定
  onUnmounted(() => {
    state.destroyArray.forEach((fn) => fn && fn())
  })
  return state
}
