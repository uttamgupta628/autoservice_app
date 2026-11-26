import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useAuth, homeFor } from '../src/lib/auth';
import { colors } from '../src/lib/theme';

const { width } = Dimensions.get('window');

// 👇 Links bahar se (yahan badal sakte hain)
const BG_IMAGE_URL =
  'https://res.cloudinary.com/dquki4xol/image/upload/v1795243790/Futuristic_Blue_Sedan_in_Motion_abasph.png';
const LOGO_URL =
  'https://res.cloudinary.com/dquki4xol/image/upload/v1795243876/AutoService_Logo_with_Blue_Accents-removebg-preview_zjpoe2.png';

// Splash kam se kam itni der dikhega (ms), session pehle restore ho jaye tab bhi
const MIN_SPLASH_MS = 2500;
const BAR_WIDTH = width * 0.34;
const ACCENT = '#2F8CFF';
const NAVY = (colors && colors.navy) || '#0A1B33';

// Splash while the saved session is restored, then route by role.
export default function Index() {
  const { user, ready } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading bar
    Animated.timing(progress, {
      toValue: 1,
      duration: MIN_SPLASH_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false, // width animate ho rahi hai
    }).start();

    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [fade, rise, scale, progress]);

  // Session restore + minimum splash time, dono ho jaye tab role ke hisaab se redirect
  if (ready && minElapsed) {
    return <Redirect href={homeFor(user)} />;
  }

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: BG_IMAGE_URL }}
        style={s.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(8,24,48,0.97)', 'rgba(8,24,48,0.78)', 'rgba(8,24,48,0.25)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            s.content,
            { opacity: fade, transform: [{ translateY: rise }, { scale }] },
          ]}
        >
          <Image source={{ uri: LOGO_URL }} style={s.logo} resizeMode="contain" />
          <View style={s.divider} />
          <Text style={s.tag}>Automotive Service Marketplace</Text>
        </Animated.View>

        {/* Bottom loading bar */}
        <View style={s.footer}>
          <View style={s.track}>
            <Animated.View style={[s.fill, { width: barWidth }]} />
          </View>
          <Text style={s.loading}>
            {ready ? 'Almost there…' : 'Loading your account…'}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  bg: { flex: 1, alignItems: 'center' },
  content: {
    marginTop: '30%',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: 140,
  },
  divider: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 12,
    marginBottom: 14,
  },
  tag: {
    color: '#C9D6E8',
    fontSize: 14.5,
    letterSpacing: 0.6,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  track: {
    width: BAR_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  loading: {
    marginTop: 12,
    color: '#9FB3CC',
    fontSize: 12.5,
    letterSpacing: 0.4,
  },
});