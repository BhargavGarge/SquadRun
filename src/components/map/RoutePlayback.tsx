// ─────────────────────────────────────────────────────────────
// RoutePlayback — Replay a recorded workout at recorded pace
// Shows animated blue dot moving along the route
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { RouteCoord } from '../../types';

interface RoutePlaybackProps {
  route: RouteCoord[];
  durationSeconds: number;
  distanceKm: number;
  accentColor?: string;
}

type PlaybackStatus = 'idle' | 'playing' | 'paused';

export default function RoutePlayback({
  route,
  durationSeconds,
  distanceKm,
  accentColor,
}: RoutePlaybackProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!route || route.length < 2) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface_container }]}>
        <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>
          No route data available
        </Text>
      </View>
    );
  }

  // Calculate time per coordinate
  const timePerCoord = durationSeconds / route.length;

  const startPlayback = useCallback(() => {
    setStatus('playing');
    setCurrentIndex(0);
    setElapsedSeconds(0);

    playbackRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= durationSeconds) {
          setStatus('idle');
          if (playbackRef.current) clearInterval(playbackRef.current);
          return durationSeconds;
        }
        const newIndex = Math.floor(next / timePerCoord);
        setCurrentIndex(Math.min(newIndex, route.length - 1));
        return next;
      });
    }, 1000);
  }, [route.length, durationSeconds, timePerCoord]);

  const pausePlayback = useCallback(() => {
    setStatus('paused');
    if (playbackRef.current) clearInterval(playbackRef.current);
  }, []);

  const resumePlayback = useCallback(() => {
    setStatus('playing');
    playbackRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= durationSeconds) {
          setStatus('idle');
          if (playbackRef.current) clearInterval(playbackRef.current);
          return durationSeconds;
        }
        const newIndex = Math.floor(next / timePerCoord);
        setCurrentIndex(Math.min(newIndex, route.length - 1));
        return next;
      });
    }, 1000);
  }, [durationSeconds, timePerCoord]);

  const stopPlayback = useCallback(() => {
    setStatus('idle');
    setCurrentIndex(0);
    setElapsedSeconds(0);
    if (playbackRef.current) clearInterval(playbackRef.current);
  }, []);

  // Center map on current playback position
  useEffect(() => {
    if (route[currentIndex] && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...route[currentIndex],
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        300
      );
    }
  }, [currentIndex, route]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, []);

  const currentCoord = route[currentIndex];
  const color = accentColor ?? theme.colors.primary;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...route[0],
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        zoomEnabled={true}
      >
        {/* Entire route polyline */}
        <Polyline coordinates={route} strokeColor={color} strokeWidth={2} opacity={0.6} />

        {/* Current position marker */}
        {currentCoord && (
          <Marker
            coordinate={currentCoord}
            title="Current position"
            pinColor={color}
          />
        )}
      </MapView>

      {/* Playback controls + progress */}
      <View
        style={[
          styles.controlsPanel,
          { backgroundColor: 'rgba(0,0,0,0.75)' },
        ]}
      >
        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: theme.colors.surface_container }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
                width: `${(elapsedSeconds / durationSeconds) * 100}%`,
              },
            ]}
          />
        </View>

        {/* Time + distance */}
        <View style={styles.infoRow}>
          <Text style={[textStyles.labelSm, { color: '#fff' }]}>
            {formatTime(elapsedSeconds)} / {formatTime(durationSeconds)}
          </Text>
          <Text style={[textStyles.labelSm, { color: '#fff' }]}>
            {distanceKm.toFixed(2)} km
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {status === 'idle' && (
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: color }]}
              onPress={startPlayback}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={[textStyles.labelMd, { color: '#fff', marginLeft: spacing[1] }]}>
                Play
              </Text>
            </TouchableOpacity>
          )}

          {status === 'playing' && (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.surface_container }]}
                onPress={pausePlayback}
              >
                <Ionicons name="pause" size={18} color={theme.colors.on_surface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.error }]}
                onPress={stopPlayback}
              >
                <Ionicons name="stop" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {status === 'paused' && (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: color }]}
                onPress={resumePlayback}
              >
                <Ionicons name="play" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.error }]}
                onPress={stopPlayback}
              >
                <Ionicons name="stop" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
