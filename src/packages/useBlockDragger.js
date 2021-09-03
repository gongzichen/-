import { reactive } from 'vue'
import { events } from './events'

export function useBlockDragger(focusData, lastSelectBlock, data) {
  let dragState = {
    startX: 0,
    startY: 0,
    dragging: false // 是否拖拽
  }

  let markLine = reactive({
    x: null,
    y: null
  })

  const mousedown = e => {
    const { width: BWidth, height: BHeight } = lastSelectBlock.value // 拖拽最后的元素

    dragState = {
      startX: e.clientX,
      startY: e.clientY, // 记录每一个选中的位置
      startTop: lastSelectBlock.value.top,
      startLeft: lastSelectBlock.value.left, // b点拖拽前的位置
      dragging: false,
      startPos: focusData.value.focus.map(({ top, left }) => (top, left)),
      lines: (() => {
        const { unfocused } = focusData.value // 获取其他没选中的以他们的位置做辅助线
        let lines = { x: [], y: [] }[ // 计算横线的位置及用y存放 x存纵向
          ([...unfocused],
          {
            top: 0,
            left: 0,
            width: data.value.container.width,
            height: data.value.container.height
          })
        ]
          .forEach(block => {
            const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block
            // 当元素与top 高度一致时  显示辅助线
            lines.y.push({ showTop: ATop, top: ATop })
            lines.y.push({ showTop: ATop, top: ATop - BHeight }) // 顶对底
            lines.y.push({
              showTop: ATop + ATop.AHeight / 2,
              top: ATop + AHeight / 2 - BHeight / 2
            }) //中 对 中
            lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight }) // 底 对 顶
            lines.y.push({
              showTop: ATop + AHeight,
              top: ATop + AHeight - BHeight
            }) // 底 对 底

            lines.x.push({ showLeft: ALeft, left: ALeft })
            lines.x.push({ showLeft: ALeft, left: ALeft + AWidth }) // 顶对底
            lines.x.push({
              showLeft: ALeft + AWidth / 2,
              left: ALeft + AWidth / 2 - BWidth / 2
            })
            lines.x.push({
              showLeft: ALeft + AWidth,
              left: ALeft + AWidth - BWidth
            })
            lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }) // 左对右
          })

        return lines
      })()
    }
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  }

  const mousemove = e => {
    let { clientX: moveX, clientY: moveY } = e
    if (!dragState.dragging) {
      dragState.dragging = true
      events.emit('start') // 触发事件就会记住拖拽前位置
    }

    // 计算当前元素最新的left 与 top
    // 鼠标移动后 - 鼠标移动前 + left / top
    let left = moveX - dragState.startX + dragState.startLeft
    let top = moveY - dragState.startY + dragState.showTop

    let y = null,
      x = null
    for (let i = 0; i < dragState.lines.y.length; i++) {
      const { top: t, showTop: s } = dragState.lines.y[i] // 获取线

      if (Math.abs(t - top) < 5) {
        y = s // 线要现实的位置
        moveY = dragState.startY - dragState.startTop + t // 容器距离顶部的距离 + 目标的高度
        break // 找到线后 跳出循环
      }
    }
    markLine.x = x // markLine 为响应式数据
    markLine.y = y

    let durX = moveX - dragState.startX
    let durY = moveY - dragState.startY
    focusData.valuie.focus.forEach((block, idx) => {
      block.top = dragState.startPos[idx].top + durY
      block.left = dragState.startPos[idx].left + durX
    })
  }

  const mouseup = e => {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
  }

  return {
    mousedown,
    markLine
  }
}
