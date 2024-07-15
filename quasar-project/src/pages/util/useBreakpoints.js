import { readonly, ref } from "vue";

const bps = ref({ xs: 0, sm: 1, md: 2, lg: 3, xl: 4 })
const currentBreakpoint = ref(bps.xl);

export default () => {
  const updateBreakpoint = () => {
  
    const windowWidth = window.innerWidth;
    
    if(windowWidth >= 1200) {
      currentBreakpoint.value = bps.xl
    } else if(windowWidth >= 992) {
      currentBreakpoint.value = bps.lg
    } else if(windowWidth >= 768) {
      currentBreakpoint.value = bps.md
    } else if(windowWidth >= 576) {
      currentBreakpoint.value = bps.sm
    } else {
      currentBreakpoint.value = bps.xs
    }
  }

  return {
    currentBreakpoint: readonly(currentBreakpoint),
    bps: readonly(bps),
    updateBreakpoint,
  };
};