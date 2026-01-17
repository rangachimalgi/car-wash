import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

const { height } = Dimensions.get('window');

const ServiceDetailsBottomSheet = forwardRef(({ 
  children, 
  initialIndex = 0,
  onSheetChange,
  ...props 
}, ref) => {
  const bottomSheetRef = useRef(null);

  // Bottom sheet snap points - using absolute values to ensure max 70%
  const snapPoints = useMemo(() => [
    height * 0.35, // 35% of screen
    height * 0.70, // 70% of screen (max)
  ], []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    snapToIndex: (index) => bottomSheetRef.current?.snapToIndex(index),
    expand: () => bottomSheetRef.current?.expand(),
    collapse: () => bottomSheetRef.current?.collapse(),
    close: () => bottomSheetRef.current?.close(),
  }));

  // Handle sheet changes
  const handleSheetChanges = (index) => {
    if (onSheetChange) {
      onSheetChange(index);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={false}
      enableOverDrag={false}
      maxDynamicContentSize={height * 0.7}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetHandle}
      {...props}
    >
      {children}
    </BottomSheet>
  );
});

ServiceDetailsBottomSheet.displayName = 'ServiceDetailsBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#28282A',
  },
  bottomSheetHandle: {
    backgroundColor: '#9E9E9E',
  },
});

export default ServiceDetailsBottomSheet;
