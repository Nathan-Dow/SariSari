import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration } from 'react-native';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  active: boolean;
}

export function BarcodeScanner({ onBarcodeScanned, active }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBarcodeScanned = ({ data, type }: { data: string, type: string }) => {
    // 1. Instantly log to your terminal
    console.log(`[SCANNER] Scanned ${type}:`, data);
    
    if (scanned || !active) return;
    
    // 2. Instantly vibrate the phone (physical confirmation)
    Vibration.vibrate();

    setScanned(true);
    onBarcodeScanned(data);
    
    // Reset lock after 2s so the same item can be scanned again
    cooldownRef.current = setTimeout(() => setScanned(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      barcodeScannerSettings={{
        barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'upc_a'],
      }}
      onBarcodeScanned={handleBarcodeScanned}
    />
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});