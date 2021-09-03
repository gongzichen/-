import { events } from "./events";

export function useMenuDragger(containerRef, data) {
  let currentComponent = null;

  // 进入时
  const dragenter = (e) => {
    e.dataTransfer.dropEffect = "move";
  };

  // 移动时
  const dragover = (e) => {
    e.preventDefault();
  };

  // 离开时 添加禁用
  const dragleave = (e) => {
    e.dataTransfer.dropEffect = "none";
  };

  // drop 松手时候  根绝拖拽最贱 添加
  const drop = (e) => {
    let blocks = data.value.blocks; // 内部渲染组件
    data.value = {
      ...data.value,
      blocks: [
        ...blocks,
        {
          top: e.offsetY,
          left: e.offsetX,
          zIndex: 1,
          key: currentComponent.key,
          alignCenter: true, // 松手时居中
        },
      ],
    };
    currentComponent = null;
  };

  const dragstart = (e, component) => {
    containerRef.value.addEventListener("dragenter", dragenter);
    containerRef.value.addEventListener("dragover", dragover);
    containerRef.value.addEventListener("dragleave", dragleave);
    containerRef.value.addEventListener("drop", drop);
    currentComponent = component;
    events.emit("start"); //
  };

  const dragend = (e) => {
    containerRef.value.removeEventListener("dragenter", dragenter);
    containerRef.value.removeEventListener("dragover", dragover);
    containerRef.value.removeEventListener("dragleave", dragleave);
    containerRef.value.removeEventListener("drop", drop);
    events.emit("end"); // 发布end
  };
  return {
    dragstart,
    dragend,
  };
}
