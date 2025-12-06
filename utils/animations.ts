/**
 * Yeahzea Animation Utilities
 * 通用动画变体和工具函数
 */

import { Variants } from 'framer-motion';

// ============================================
// 通用动画变体 (Variants)
// ============================================

/**
 * 淡入淡出动画
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 从下方滑入动画
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * 从右侧滑入动画
 */
export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * 从左侧滑入动画
 */
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * 缩放出现动画
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 弹跳出现动画（用于成功提示）
 */
export const bounceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * 脉冲动画（用于加载状态）
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: {
    scale: 1,
    opacity: 1,
  },
};

/**
 * 闪烁动画（用于警告提示）
 */
export const blinkVariants: Variants = {
  blink: {
    opacity: [1, 0.3, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: {
    opacity: 1,
  },
};

/**
 * 旋转动画（用于加载图标）
 */
export const rotateVariants: Variants = {
  rotate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  idle: {
    rotate: 0,
  },
};

/**
 * 列表项动画（用于列表渲染）
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 卡片飞入动画（用于发票卡片）
 */
export const cardFlyInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * 模态框动画
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

/**
 * 背景遮罩动画
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * 进度条动画
 */
export const progressVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

/**
 * 拖拽区域动画
 */
export const dragAreaVariants: Variants = {
  idle: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  dragOver: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * 成功图标动画
 */
export const successIconVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

/**
 * 错误图标动画
 */
export const errorIconVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: 180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

// ============================================
// 动画配置常量
// ============================================

export const ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};

export const ANIMATION_EASING = {
  easeOut: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

// ============================================
// 工具函数
// ============================================

/**
 * 创建延迟动画变体
 */
export const createStaggerVariants = (
  baseVariants: Variants,
  staggerDelay: number = 0.05
): Variants => {
  return {
    ...baseVariants,
    visible: {
      ...baseVariants.visible,
      transition: {
        ...baseVariants.visible?.transition,
        staggerChildren: staggerDelay,
      },
    },
  };
};

/**
 * 创建自定义延迟的列表项动画
 */
export const createListItemVariants = (delay: number = 0.05): Variants => {
  return {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * delay,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };
};

