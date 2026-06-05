import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={styles.logoTravi}>TRAVI</Text>
          <Text style={styles.logoGo}>GO</Text>
          <Text style={styles.logoAk}>-AK</Text>
        </Text>
        <Text style={styles.tagline}>
          Le transport digitalisé au cœur de notre quotidien
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoTravi: {
    color: COLORS.graphite,
  },
  logoGo: {
    color: COLORS.terracotta,
  },
  logoAk: {
    color: COLORS.graphite,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.taupe,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
