import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 360;
const MAX_SCALE = 2;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, MAX_SCALE);
  const rs = (size: number) => Math.round(size * scale);
  const horizontalPadding = rs(16);
  const numColumns = width >= 600 ? (width >= 1024 ? 4 : 3) : 1;
  return { width, height, scale, rs, horizontalPadding, numColumns };
}
