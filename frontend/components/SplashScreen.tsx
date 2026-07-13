import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Circle, Line, G, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GROUND = H * 0.72;
const HEAD_Y = GROUND - 72;
const SHOULDER = GROUND - 55;
const HIP = GROUND - 25;
const BALL_R = 8;
const BALL_DEST_X = W / 2;
const BALL_DEST_Y = H * 0.35;
const NEG_BALL_R = new Animated.Value(-BALL_R);

const lerp = (p: Animated.Value, i: number[], o: number[]) =>
  p.interpolate({ inputRange: i, outputRange: o, extrapolate: 'clamp' });

interface Props { onFinish: () => void }

export default function SplashScreen({ onFinish }: Props) {
  const p = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current = Animated.timing(p, {
      toValue: 1,
      duration: 8000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current.start(() => onFinish());

    return () => {
      animRef.current?.stop();
    };
  }, []);

  const runX = useMemo(() => lerp(p, [0, 0.12], [-60, W * 0.30]), [p]);
  const runOp = useMemo(() => lerp(p, [0, 0.02, 0.14, 0.17], [0, 1, 1, 0]), [p]);
  const legP = useMemo(() => lerp(p, [0, 0.12], [0, 8]), [p]);
  const lLeg = useMemo(() => legP.interpolate({ inputRange: [0,1,2,3,4,5,6,7,8], outputRange: [22,-22,22,-22,22,-22,22,-22,22] }), [legP]);
  const rLeg = useMemo(() => legP.interpolate({ inputRange: [0,1,2,3,4,5,6,7,8], outputRange: [-22,22,-22,22,-22,22,-22,22,-22] }), [legP]);
  const kick = useMemo(() => lerp(p, [0.10, 0.13, 0.16], [0, -75, -10]), [p]);

  const smX = useMemo(() => lerp(p, [0.28, 0.40], [W + 60, W * 0.68]), [p]);
  const smOp = useMemo(() => lerp(p, [0.28, 0.31, 0.44, 0.50], [0, 1, 1, 0]), [p]);
  const smJump = useMemo(() => lerp(p, [0.38, 0.42, 0.46], [0, -85, -55]), [p]);
  const smArm = useMemo(() => lerp(p, [0.38, 0.43], [55, -35]), [p]);

  const bStartX = W * 0.30 + 10;
  const bStartY = GROUND - 20;
  const bFlight = useMemo(() => lerp(p, [0.12, 0.38], [0, 1]), [p]);
  const bX = useMemo(() => bFlight.interpolate({ inputRange: [0,1], outputRange: [bStartX, BALL_DEST_X] }), [bFlight]);
  const bY = useMemo(() => bFlight.interpolate({ inputRange: [0, 0.5, 1], outputRange: [bStartY, BALL_DEST_Y - 30, BALL_DEST_Y] }), [bFlight]);
  const bOp = useMemo(() => lerp(p, [0.10, 0.12, 0.85, 0.90], [0, 1, 1, 0]), [p]);
  const trailOp = useMemo(() => lerp(p, [0.12, 0.16, 0.36, 0.40], [0, 0.5, 0.5, 0]), [p]);

  const morph = useMemo(() => lerp(p, [0.46, 0.58], [0, 1]), [p]);
  const ballScl = useMemo(() => morph.interpolate({ inputRange: [0,1], outputRange: [1, 0] }), [morph]);
  const oScl = useMemo(() => morph.interpolate({ inputRange: [0,1], outputRange: [0, 1] }), [morph]);

  const flashOp = useMemo(() => lerp(p, [0.40, 0.42, 0.48], [0, 0.9, 0]), [p]);
  const flashR = useMemo(() => lerp(p, [0.40, 0.48], [8, 65]), [p]);
  const sparks = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const d = lerp(p, [0.41, 0.49], [0, 30 + (i % 3) * 12]);
    const sx = d.interpolate({ inputRange: [0,80], outputRange: [0, Math.cos(a)*55], extrapolate: 'clamp' });
    const sy = d.interpolate({ inputRange: [0,80], outputRange: [0, Math.sin(a)*45-8], extrapolate: 'clamp' });
    const so = lerp(p, [0.41, 0.49], [1, 0]);
    return { sx, sy, so };
  }), [p]);

  const gOp = useMemo(() => lerp(p, [0.55, 0.65], [0, 1]), [p]);
  const gX = useMemo(() => lerp(p, [0.55, 0.65], [-45, 0]), [p]);
  const aOp = useMemo(() => lerp(p, [0.58, 0.68], [0, 1]), [p]);
  const aY = useMemo(() => lerp(p, [0.58, 0.68], [35, 0]), [p]);
  const lOp = useMemo(() => lerp(p, [0.61, 0.71], [0, 1]), [p]);
  const lX = useMemo(() => lerp(p, [0.61, 0.71], [45, 0]), [p]);
  const oOp = useMemo(() => lerp(p, [0.52, 0.60], [0, 1]), [p]);
  const tagOp = useMemo(() => lerp(p, [0.68, 0.76], [0, 1]), [p]);
  const glowOp = useMemo(() => lerp(p, [0.68, 0.78, 0.85], [0, 0.3, 0]), [p]);
  const fadeOp = useMemo(() => lerp(p, [0.87, 1.0], [1, 0]), [p]);

  const lLegStr = useMemo(() => lLeg.interpolate({ inputRange: [0, 1], outputRange: ['0', '1'] }), [lLeg]);

  return (
    <Animated.View style={[s.root, { opacity: fadeOp }]}>
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        <Defs>
          <RadialGradient id="gl" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#4be277" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#4be277" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#4be277" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="fl" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <Stop offset="35%" stopColor="#4be277" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#4be277" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Path d={`M0,${GROUND + 12} L${W},${GROUND + 12}`} stroke="#1a2a1a" strokeWidth={1.5} fill="none" />

        <AnimatedG x={runX} opacity={runOp}>
          <Circle cx={0} cy={HEAD_Y} r={9} fill="#4be277" />
          <Line x1={0} y1={HEAD_Y + 9} x2={0} y2={HIP} stroke="#4be277" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={0} y1={SHOULDER} x2={-16} y2={GROUND - 36} stroke="#4be277" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={0} y1={SHOULDER} x2={16} y2={GROUND - 38} stroke="#4be277" strokeWidth={2.5} strokeLinecap="round" />
          <G transform={`rotate(${lLeg}, 0, ${HIP})`}>
            <Line x1={0} y1={HIP} x2={-4} y2={GROUND + 5} stroke="#4be277" strokeWidth={3} strokeLinecap="round" />
          </G>
          <G transform={`rotate(${Animated.add(rLeg, kick)}, 0, ${HIP})`}>
            <Line x1={0} y1={HIP} x2={4} y2={GROUND + 5} stroke="#4be277" strokeWidth={3} strokeLinecap="round" />
            <Line x1={4} y1={GROUND + 3} x2={11} y2={GROUND + 5} stroke="#4be277" strokeWidth={2.5} strokeLinecap="round" />
          </G>
        </AnimatedG>

        <AnimatedG x={smX} opacity={smOp}>
          <AnimatedG y={smJump}>
            <Circle cx={0} cy={HEAD_Y} r={9} fill="#e0e0e0" />
            <Line x1={0} y1={HEAD_Y + 9} x2={0} y2={HIP} stroke="#e0e0e0" strokeWidth={3.5} strokeLinecap="round" />
            <G transform={`rotate(${smArm}, 0, ${SHOULDER})`}>
              <Line x1={0} y1={SHOULDER} x2={20} y2={HEAD_Y} stroke="#e0e0e0" strokeWidth={2.5} strokeLinecap="round" />
              <Circle cx={20} cy={HEAD_Y - 2} r={3} fill="#e0e0e0" />
            </G>
            <Line x1={0} y1={SHOULDER} x2={-14} y2={GROUND - 36} stroke="#e0e0e0" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={-3} y1={HIP} x2={-9} y2={GROUND + 2} stroke="#e0e0e0" strokeWidth={3} strokeLinecap="round" />
            <Line x1={3} y1={HIP} x2={9} y2={GROUND + 2} stroke="#e0e0e0" strokeWidth={3} strokeLinecap="round" />
          </AnimatedG>
        </AnimatedG>

        <AnimatedG x={bX} y={bY} opacity={trailOp}>
          <Circle cx={0} cy={0} r={BALL_R + 6} fill="url(#gl)" />
          <Circle cx={-10} cy={6} r={BALL_R + 2} fill="url(#gl)" opacity={0.4} />
          <Circle cx={-18} cy={12} r={BALL_R - 2} fill="url(#gl)" opacity={0.2} />
        </AnimatedG>

        <AnimatedG x={BALL_DEST_X} y={BALL_DEST_Y}>
          <AnimatedCircle cx={0} cy={0} r={flashR} fill="url(#fl)" opacity={flashOp} />
        </AnimatedG>

        {sparks.map((s, i) => (
          <AnimatedG key={i} x={BALL_DEST_X} y={BALL_DEST_Y} opacity={s.so}>
            <AnimatedCircle cx={s.sx} cy={s.sy} r={2.5} fill={i % 2 === 0 ? '#4be277' : '#fff'} />
          </AnimatedG>
        ))}
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: BALL_R * 2,
          height: BALL_R * 2,
          borderRadius: BALL_R,
          backgroundColor: '#fff',
          opacity: bOp,
          transform: [
            { translateX: Animated.add(bX, NEG_BALL_R) },
            { translateY: Animated.add(bY, NEG_BALL_R) },
            { scale: ballScl },
          ],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          left: BALL_DEST_X - 26,
          top: BALL_DEST_Y - 26,
          width: 52,
          height: 52,
          borderRadius: 26,
          borderWidth: 5,
          borderColor: '#4be277',
          backgroundColor: 'transparent',
          opacity: oOp,
          transform: [{ scale: oScl }],
        }}
      />

      <View style={[s.goalWrap, { top: BALL_DEST_Y - 38 }]}>
        <Animated.Text style={[s.letter, { opacity: gOp, transform: [{ translateX: gX }] }]}>G</Animated.Text>
        <View style={{ width: 58 }} />
        <Animated.Text style={[s.letter, { opacity: aOp, transform: [{ translateY: aY }] }]}>A</Animated.Text>
        <Animated.Text style={[s.letter, { opacity: lOp, transform: [{ translateX: lX }] }]}>L</Animated.Text>
      </View>

      <Animated.Text style={[s.tag, { top: BALL_DEST_Y + 45, opacity: tagOp }]}>
        Game Organizer & Arena League
      </Animated.Text>

      <Animated.View style={[StyleSheet.absoluteFillObject, s.pointerEventsNone, { backgroundColor: '#4be277', opacity: glowOp }]} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  pointerEventsNone: { pointerEvents: 'none' },
  goalWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 76,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: '#4be277',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tag: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
});
