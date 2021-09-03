import { computed, ref } from 'vue'

// 选中元素
export function useFocus(data, callback) {
  const selectIndex = ref(-1)

  // 最后选择哪一个
  const lastSelectBlock = computed(() => data.value.blocks[selectIndex.value])

  const focusData = computed(() => {
    let focus = []
    let unfocused = []
    data.value.blocks.forEach((block) =>
      (block.focus ? focus : unfocused).push(block)
    )
    return { focus, unfocused }
  })
  //  清除选择
  const clearBlockFocus = () => {
    data.value.blocks.forEach((block) => (block.focus = false))
  }

  const containerMousedown = () => {
    clearBlockFocus() // 让容器失去焦点
    selectIndex.value = -1
  }

  const blockMouseDown = (e, block, index) => {
    e.preventDefault()
    e.stopPropagation()

    // block 我们规划一个属性focus 获取焦点后将focus 变为 true
    if (e.shiftKey) {
      if (focusData.value.focus.length <= 1) {
        block.focus = true
      } else {
        block.focus = !block.focus
      }
    } else {
      if (!block.focus) {
        clearBlockFocus()
        block.focus = true // 清空其他人focus
      } // 当前自己 已被选中 再次点击时 还是选中状态
    }

    selectIndex.value = index
    callback(e)
  }

  return {
    blockMouseDown,
    containerMousedown,
    focusData,
    lastSelectBlock
  }
}
