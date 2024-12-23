declare module 'react-wheel-of-prizes' {
  interface WheelComponentProps {
    segments: string[];
    segColors: string[];
    onFinished: (winner: string) => void;
    primaryColor?: string;
    contrastColor?: string;
    buttonText?: string;
    isOnlyOnce?: boolean;
    size?: number;
    upDuration?: number;
    downDuration?: number;
    fontFamily?: string;
  }

  const WheelComponent: React.ComponentType<WheelComponentProps>;
  export default WheelComponent;
}
